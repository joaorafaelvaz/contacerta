import { markPaidAction } from "@/actions/transactions";
import {
  AlertCircleIcon,
  CalendarClockIcon,
  CreditCardIcon,
  PiggyBankIcon,
  WalletIcon,
} from "@/components/icons";
import { Money } from "@/components/money";
import { Card, EmptyState, StatCard, listActionClass } from "@/components/ui";
import { formatDateBR, formatMonthPT } from "@/lib/format";
import { getCards } from "@/lib/data";
import { requireFamily } from "@/lib/session";
import {
  addDaysISO,
  formatBRL,
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
  const totalDue = upcoming
    .filter((t) => t.type !== "income")
    .reduce((acc, t) => acc + t.amountCents, 0);
  const overdueCount = upcoming.filter((t) => t.dueDate! < today).length;
  const totalInvoices = invoices.reduce((acc, i) => acc + i.invoice.pendingTotalCents, 0);

  return (
    <>
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Visão geral</h1>
        <p className="text-sm capitalize text-slate-500 dark:text-slate-400">{formatMonthPT(month)}</p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Saldo em contas"
          value={<Money cents={totalBalance} signed />}
          icon={<WalletIcon />}
          tone={totalBalance < 0 ? "danger" : "success"}
        />
        <StatCard
          label="A pagar (30 dias)"
          value={formatBRL(totalDue)}
          hint={
            overdueCount > 0 ? (
              <span className="font-semibold text-red-600 dark:text-red-400">
                {overdueCount} conta{overdueCount > 1 ? "s" : ""} atrasada{overdueCount > 1 ? "s" : ""}
              </span>
            ) : (
              "nada atrasado"
            )
          }
          icon={<CalendarClockIcon />}
          tone={overdueCount > 0 ? "danger" : "default"}
        />
        <StatCard
          label="Faturas em aberto"
          value={formatBRL(totalInvoices)}
          hint={`${cards.length} cart${cards.length === 1 ? "ão" : "ões"}`}
          icon={<CreditCardIcon />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Saldo das contas" icon={<WalletIcon />}>
          {accounts.length === 0 ? (
            <EmptyState
              message="Nenhuma conta cadastrada ainda."
              action={{ href: "/contas/nova", label: "Criar primeira conta" }}
            />
          ) : (
            <>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {accounts.map((acc) => (
                  <li key={acc.id} className="flex justify-between py-2.5 text-sm">
                    <span className="text-slate-700 dark:text-slate-300">{acc.name}</span>
                    <Money cents={acc.balanceCents} signed className="font-medium" />
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2.5 text-sm font-bold">
                <span>Total</span>
                <Money cents={totalBalance} signed />
              </div>
            </>
          )}
        </Card>

        <Card title="Faturas dos cartões" icon={<CreditCardIcon />}>
          {invoices.length === 0 ? (
            <EmptyState
              message="Nenhum cartão cadastrado ainda."
              action={{ href: "/cartoes/novo", label: "Cadastrar cartão" }}
            />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.map(({ card, invoice }) => (
                <li key={card.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <Link
                      href={`/cartoes/${card.id}`}
                      className="font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400"
                    >
                      {card.name}
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400">vence {formatDateBR(invoice.dueDate)}</p>
                  </div>
                  <Money cents={invoice.totalCents} className="font-medium" />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Próximos vencimentos (30 dias)" icon={<CalendarClockIcon />}>
          {upcoming.length === 0 ? (
            <EmptyState message="Nenhuma conta a pagar no período. 🎉" />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {upcoming.map((txn) => {
                const overdue = txn.dueDate! < today;
                return (
                  <li key={txn.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-slate-700 dark:text-slate-300">{txn.description}</p>
                      <p className="mt-0.5 text-xs">
                        {overdue ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-950/50 px-2 py-0.5 font-semibold text-red-700 dark:text-red-300">
                            <AlertCircleIcon className="h-3 w-3" />
                            venceu {formatDateBR(txn.dueDate!)}
                          </span>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400">vence {formatDateBR(txn.dueDate!)}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Money
                        cents={txn.type === "income" ? txn.amountCents : -txn.amountCents}
                        signed
                        className="font-medium"
                      />
                      {txn.accountId && (
                        <form action={markPaidAction}>
                          <input type="hidden" name="id" value={txn.id} />
                          <button type="submit" className={listActionClass}>
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

        <Card title={`Orçamento de ${formatMonthPT(month)}`} icon={<PiggyBankIcon />}>
          {budgets.length === 0 ? (
            <EmptyState
              message="Nenhuma meta definida para este mês."
              action={{ href: "/orcamentos", label: "Definir metas" }}
            />
          ) : (
            <ul className="space-y-3.5">
              {budgets.map((item) => {
                const pct = Math.min(100, Math.round((item.spentCents / item.budgetCents) * 100));
                const over = item.spentCents > item.budgetCents;
                return (
                  <li key={item.budgetId}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium text-slate-600 dark:text-slate-400">{item.categoryName}</span>
                      <span className={over ? "font-semibold text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}>
                        <Money cents={item.spentCents} /> / <Money cents={item.budgetCents} />
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all ${over ? "bg-red-500" : "bg-emerald-500"}`}
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
    </>
  );
}
