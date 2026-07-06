import { markPaidAction } from "@/actions/transactions";
import { Money } from "@/components/money";
import { Card, EmptyState } from "@/components/ui";
import { formatDateBR, formatMonthPT } from "@/lib/format";
import { getCards } from "@/lib/data";
import { requireFamily } from "@/lib/session";
import {
  addDaysISO,
  getAccountsWithBalances,
  getBudgetUsage,
  getInvoice,
  invoiceCycleForDate,
  materializeUpcoming,
  monthOfISO,
  todayISO,
} from "@meusaldo/core";
import { db, schema } from "@meusaldo/db";
import { and, asc, eq, isNotNull, lte } from "drizzle-orm";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await requireFamily();
  const today = todayISO();
  const month = monthOfISO(today);

  // gera as pendências das recorrências (mês atual e seguinte) — idempotente
  await materializeUpcoming(db, user.familyId, month);

  const cards = await getCards(user.familyId);
  const [accounts, invoices, budgets, upcoming] = await Promise.all([
    getAccountsWithBalances(db, user.familyId),
    Promise.all(
      cards.map(async (card) => ({
        card,
        invoice: await getInvoice(db, card, invoiceCycleForDate(card.closingDay, today)),
      })),
    ),
    getBudgetUsage(db, user.familyId, month),
    db
      .select()
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.familyId, user.familyId),
          eq(schema.transactions.status, "pending"),
          isNotNull(schema.transactions.dueDate),
          lte(schema.transactions.dueDate, addDaysISO(today, 30)),
        ),
      )
      .orderBy(asc(schema.transactions.dueDate))
      .limit(12),
  ]);

  const totalBalance = accounts.reduce((acc, a) => acc + a.balanceCents, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Saldo das contas">
        {accounts.length === 0 ? (
          <EmptyState message="Cadastre sua primeira conta em Contas." />
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              {accounts.map((acc) => (
                <li key={acc.id} className="flex justify-between py-2 text-sm">
                  <span className="text-slate-700">{acc.name}</span>
                  <Money cents={acc.balanceCents} signed className="font-medium" />
                </li>
              ))}
            </ul>
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-sm font-bold">
              <span>Total</span>
              <Money cents={totalBalance} signed />
            </div>
          </>
        )}
      </Card>

      <Card title="Faturas dos cartões">
        {invoices.length === 0 ? (
          <EmptyState message="Cadastre seus cartões em Cartões." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {invoices.map(({ card, invoice }) => (
              <li key={card.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <Link href={`/cartoes/${card.id}`} className="font-medium text-slate-700 hover:text-emerald-700">
                    {card.name}
                  </Link>
                  <p className="text-xs text-slate-400">vence {formatDateBR(invoice.dueDate)}</p>
                </div>
                <Money cents={invoice.totalCents} className="font-medium" />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Próximos vencimentos (30 dias)">
        {upcoming.length === 0 ? (
          <EmptyState message="Nenhuma conta a pagar no período. 🎉" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {upcoming.map((txn) => {
              const overdue = txn.dueDate! < today;
              return (
                <li key={txn.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <div>
                    <p className="text-slate-700">{txn.description}</p>
                    <p className={`text-xs ${overdue ? "font-semibold text-red-600" : "text-slate-400"}`}>
                      {overdue ? "venceu" : "vence"} {formatDateBR(txn.dueDate!)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Money
                      cents={txn.type === "income" ? txn.amountCents : -txn.amountCents}
                      signed
                      className="font-medium"
                    />
                    {txn.accountId && (
                      <form action={markPaidAction}>
                        <input type="hidden" name="id" value={txn.id} />
                        <button type="submit" className="text-xs font-medium text-emerald-700 hover:underline">
                          Pagar
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title={`Orçamento de ${formatMonthPT(month)}`}>
        {budgets.length === 0 ? (
          <EmptyState message="Defina metas por categoria em Orçamentos." />
        ) : (
          <ul className="space-y-3">
            {budgets.map((item) => {
              const pct = Math.min(100, Math.round((item.spentCents / item.budgetCents) * 100));
              const over = item.spentCents > item.budgetCents;
              return (
                <li key={item.budgetId}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium text-slate-600">{item.categoryName}</span>
                    <span className={over ? "font-semibold text-red-600" : "text-slate-500"}>
                      <Money cents={item.spentCents} /> / <Money cents={item.budgetCents} />
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${over ? "bg-red-500" : "bg-emerald-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
