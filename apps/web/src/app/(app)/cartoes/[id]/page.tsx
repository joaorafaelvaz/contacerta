import { payInvoiceAction } from "@/actions/invoices";
import { Money } from "@/components/money";
import { Card, EmptyState, PageHeader, primaryButtonClass, selectClass, inputClass } from "@/components/ui";
import { getAccounts } from "@/lib/data";
import { formatDateBR, formatMonthPT } from "@/lib/format";
import { requireFamily } from "@/lib/session";
import {
  addMonthsYM,
  getInvoice,
  invoiceCycleForDate,
  todayISO,
} from "@meusaldo/core";
import { db, schema } from "@meusaldo/db";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CardInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ciclo?: string }>;
}) {
  const user = await requireFamily();
  const { id } = await params;
  const { ciclo } = await searchParams;

  const [card] = await db
    .select()
    .from(schema.creditCards)
    .where(and(eq(schema.creditCards.id, id), eq(schema.creditCards.familyId, user.familyId)));
  if (!card) notFound();

  const currentCycle = invoiceCycleForDate(card.closingDay, todayISO());
  const cycle = ciclo && /^\d{4}-\d{2}$/.test(ciclo) ? ciclo : currentCycle;
  const invoice = await getInvoice(db, card, cycle);
  const accounts = await getAccounts(user.familyId);

  return (
    <>
      <PageHeader title={`Fatura · ${card.name}`} />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href={`/cartoes/${card.id}?ciclo=${addMonthsYM(cycle, -1)}`}
              className="rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              ←
            </Link>
            <span className="min-w-40 text-center font-semibold capitalize">
              {formatMonthPT(cycle)}
              {cycle === currentCycle && (
                <span className="ml-1 text-xs font-normal text-emerald-600 dark:text-emerald-400">(atual)</span>
              )}
            </span>
            <Link
              href={`/cartoes/${card.id}?ciclo=${addMonthsYM(cycle, 1)}`}
              className="rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              →
            </Link>
          </div>
          <div className="text-right text-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Período {formatDateBR(invoice.start)} – {formatDateBR(invoice.end)} · vence{" "}
              {formatDateBR(invoice.dueDate)}
            </p>
            <p>
              Total: <Money cents={invoice.totalCents} className="font-bold" />
              {invoice.pendingTotalCents !== invoice.totalCents && (
                <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                  (pendente: <Money cents={invoice.pendingTotalCents} />)
                </span>
              )}
            </p>
          </div>
        </div>
      </Card>

      {invoice.pendingTotalCents > 0 && (
        <Card title="Pagar fatura" className="mb-4">
          <form action={payInvoiceAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="cardId" value={card.id} />
            <input type="hidden" name="cycle" value={cycle} />
            <label className="block">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Debitar da conta</span>
              <select
                name="accountId"
                required
                defaultValue={card.paymentAccountId ?? ""}
                className={selectClass}
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Data do pagamento</span>
              <input type="date" name="date" defaultValue={todayISO()} className={inputClass} />
            </label>
            <button type="submit" className={primaryButtonClass}>
              Pagar <Money cents={invoice.pendingTotalCents} className="ml-1" />
            </button>
          </form>
        </Card>
      )}

      <Card title="Lançamentos da fatura">
        {invoice.transactions.length === 0 ? (
          <EmptyState message="Nenhum lançamento neste ciclo." />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {invoice.transactions.map((txn) => (
              <li key={txn.id} className="flex items-center justify-between gap-3 py-2">
                <div>
                  <p className="text-sm text-slate-800 dark:text-slate-200">{txn.description}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDateBR(txn.date)}
                    {txn.status === "paid" && " · pago"}
                  </p>
                </div>
                <Money
                  cents={txn.type === "income" ? -txn.amountCents : txn.amountCents}
                  className="text-sm font-medium"
                />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

