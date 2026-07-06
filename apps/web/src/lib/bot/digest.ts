import { getCards } from "@/lib/data";
import {
  addDaysISO,
  type DigestData,
  formatDigest,
  getInvoice,
  invoiceCycleForDate,
  materializeUpcoming,
  monthOfISO,
  todayISO,
} from "@meusaldo/core";
import { type Db, schema } from "@meusaldo/db";
import { and, asc, eq, isNotNull, lte } from "drizzle-orm";
import { WahaChannel, wahaConfigured } from "./waha";

/** Monta o resumo diário da família; null quando não há nada a avisar. */
export async function buildFamilyDigest(db: Db, familyId: string): Promise<string | null> {
  const today = todayISO();
  const tomorrow = addDaysISO(today, 1);
  await materializeUpcoming(db, familyId, monthOfISO(today));

  const pending = await db
    .select()
    .from(schema.transactions)
    .where(
      and(
        eq(schema.transactions.familyId, familyId),
        eq(schema.transactions.status, "pending"),
        isNotNull(schema.transactions.accountId),
        isNotNull(schema.transactions.dueDate),
        lte(schema.transactions.dueDate, tomorrow),
      ),
    )
    .orderBy(asc(schema.transactions.dueDate));

  const data: DigestData = { overdue: [], dueToday: [], dueTomorrow: [], invoices: [] };
  for (const txn of pending) {
    const item = { description: txn.description, amountCents: txn.amountCents, dueDate: txn.dueDate! };
    if (txn.dueDate! < today) data.overdue.push(item);
    else if (txn.dueDate === today) data.dueToday.push(item);
    else data.dueTomorrow.push(item);
  }

  const cards = await getCards(familyId);
  for (const card of cards) {
    const invoice = await getInvoice(db, card, invoiceCycleForDate(card.closingDay, today));
    if (invoice.pendingTotalCents > 0 && invoice.dueDate <= addDaysISO(today, 3)) {
      data.invoices.push({
        cardName: card.name,
        totalCents: invoice.pendingTotalCents,
        dueDate: invoice.dueDate,
      });
    }
  }

  return formatDigest(data);
}

/** Envia o resumo diário a todos os membros com telefone vinculado. */
export async function sendDailyDigests(db: Db): Promise<void> {
  if (!wahaConfigured()) return;
  const channel = new WahaChannel();

  const members = await db
    .select({ familyId: schema.users.familyId, phone: schema.users.phone })
    .from(schema.users)
    .where(and(isNotNull(schema.users.phone), isNotNull(schema.users.familyId)));

  const byFamily = new Map<string, string[]>();
  for (const m of members) {
    const list = byFamily.get(m.familyId!) ?? [];
    list.push(m.phone!);
    byFamily.set(m.familyId!, list);
  }

  for (const [familyId, phones] of byFamily) {
    try {
      const digest = await buildFamilyDigest(db, familyId);
      if (!digest) continue;
      for (const phone of phones) {
        await channel.send(phone, digest).catch((err) => {
          console.error(`[digest] falha ao enviar para ${phone}:`, err);
        });
      }
    } catch (err) {
      console.error(`[digest] falha na família ${familyId}:`, err);
    }
  }
}
