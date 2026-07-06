import { type CreditCard, type Db, schema, type Transaction } from "@meusaldo/db";
import { and, asc, between, eq, inArray } from "drizzle-orm";
import type { ISODate, YearMonth } from "../dates";
import { cycleRange, invoiceDueDate } from "../invoice";

export interface Invoice {
  cycle: YearMonth;
  start: ISODate;
  end: ISODate;
  dueDate: ISODate;
  totalCents: number;
  paidTotalCents: number;
  pendingTotalCents: number;
  transactions: Transaction[];
}

const signed = (t: Transaction) => (t.type === "income" ? -t.amountCents : t.amountCents);

/** Fatura derivada: lançamentos do cartão dentro do ciclo de competência. */
export async function getInvoice(db: Db, card: CreditCard, cycle: YearMonth): Promise<Invoice> {
  const { start, end } = cycleRange(card.closingDay, cycle);
  const txns = await db
    .select()
    .from(schema.transactions)
    .where(
      and(
        eq(schema.transactions.creditCardId, card.id),
        between(schema.transactions.date, start, end),
      ),
    )
    .orderBy(asc(schema.transactions.date), asc(schema.transactions.createdAt));

  const totalCents = txns.reduce((acc, t) => acc + signed(t), 0);
  const paidTotalCents = txns.filter((t) => t.status === "paid").reduce((a, t) => a + signed(t), 0);

  return {
    cycle,
    start,
    end,
    dueDate: invoiceDueDate(card.closingDay, card.dueDay, cycle),
    totalCents,
    paidTotalCents,
    pendingTotalCents: totalCents - paidTotalCents,
    transactions: txns,
  };
}

/**
 * Paga a fatura: cria uma saída paga na conta escolhida no valor pendente do
 * ciclo e marca os lançamentos do ciclo como pagos. Tudo numa transação SQL.
 */
export async function payInvoice(
  db: Db,
  input: {
    card: CreditCard;
    cycle: YearMonth;
    accountId: string;
    date: ISODate;
    userId?: string;
  },
): Promise<{ amountCents: number }> {
  const { card, cycle, accountId, date, userId } = input;
  const invoice = await getInvoice(db, card, cycle);
  const amountCents = invoice.pendingTotalCents;
  if (amountCents <= 0) {
    throw new Error("Fatura sem valor pendente para pagar");
  }

  await db.transaction(async (tx) => {
    await tx.insert(schema.transactions).values({
      familyId: card.familyId,
      description: `Pagamento fatura ${card.name} (${cycle})`,
      amountCents,
      type: "expense",
      status: "paid",
      date,
      accountId,
      createdBy: userId ?? null,
    });
    const pendingIds = invoice.transactions.filter((t) => t.status === "pending").map((t) => t.id);
    if (pendingIds.length > 0) {
      await tx
        .update(schema.transactions)
        .set({ status: "paid", updatedAt: new Date() })
        .where(inArray(schema.transactions.id, pendingIds));
    }
  });

  return { amountCents };
}
