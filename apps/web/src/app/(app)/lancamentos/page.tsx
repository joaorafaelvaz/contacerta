import { deleteTransactionAction, markPaidAction } from "@/actions/transactions";
import { ConfirmButton } from "@/components/confirm-button";
import {
  ArrowDownIcon,
  ArrowLeftRightIcon,
  ArrowUpIcon,
} from "@/components/icons";
import { Money } from "@/components/money";
import {
  Card,
  EmptyState,
  PageHeader,
  dangerButtonClass,
  ghostActionClass,
  listActionClass,
  secondaryButtonClass,
  selectCompactClass,
} from "@/components/ui";
import { getAccounts, getCards, getCategories } from "@/lib/data";
import { formatDateBR, formatMonthPT } from "@/lib/format";
import { requireFamily } from "@/lib/session";
import { addMonthsYM, daysInMonth, makeDate, monthOfISO, parseYM, todayISO } from "@meusaldo/core";
import { db, schema } from "@meusaldo/db";
import { and, asc, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import Link from "next/link";

function DirectionIcon({ type }: { type: string }) {
  if (type === "income")
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
        <ArrowUpIcon className="h-4 w-4" />
      </span>
    );
  if (type === "expense")
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/50 text-red-500 dark:text-red-400">
        <ArrowDownIcon className="h-4 w-4" />
      </span>
    );
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
      <ArrowLeftRightIcon className="h-4 w-4" />
    </span>
  );
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; origem?: string; categoria?: string; situacao?: string }>;
}) {
  const user = await requireFamily();
  const sp = await searchParams;
  const month = sp.mes && /^\d{4}-\d{2}$/.test(sp.mes) ? sp.mes : monthOfISO(todayISO());
  const { year, month: m } = parseYM(month);
  const monthStart = makeDate(year, m, 1);
  const monthEnd = makeDate(year, m, daysInMonth(year, m));

  const [accounts, cards, categories] = await Promise.all([
    getAccounts(user.familyId),
    getCards(user.familyId),
    getCategories(user.familyId),
  ]);

  const filters: SQL[] = [
    eq(schema.transactions.familyId, user.familyId),
    gte(schema.transactions.date, monthStart),
    lte(schema.transactions.date, monthEnd),
  ];
  if (sp.origem?.startsWith("acc:")) filters.push(eq(schema.transactions.accountId, sp.origem.slice(4)));
  if (sp.origem?.startsWith("card:")) filters.push(eq(schema.transactions.creditCardId, sp.origem.slice(5)));
  if (sp.categoria) filters.push(eq(schema.transactions.categoryId, sp.categoria));
  if (sp.situacao === "paid" || sp.situacao === "pending")
    filters.push(eq(schema.transactions.status, sp.situacao));

  const txns = await db
    .select()
    .from(schema.transactions)
    .where(and(...filters))
    .orderBy(desc(schema.transactions.date), desc(schema.transactions.createdAt));

  const accountName = new Map(accounts.map((a) => [a.id, a.name]));
  const cardName = new Map(cards.map((c) => [c.id, c.name]));
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));

  const qs = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { mes: month, origem: sp.origem, categoria: sp.categoria, situacao: sp.situacao, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    return `/lancamentos?${params.toString()}`;
  };

  const totalIncome = txns
    .filter((t) => t.type === "income")
    .reduce((a, t) => a + t.amountCents, 0);
  const totalExpense = txns
    .filter((t) => t.type === "expense")
    .reduce((a, t) => a + t.amountCents, 0);

  return (
    <>
      <PageHeader
        title="Lançamentos"
        subtitle={`${txns.length} registro${txns.length === 1 ? "" : "s"} em ${formatMonthPT(month)}`}
        action={{ href: "/lancamentos/novo", label: "+ Novo lançamento" }}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/transferencias/nova" className={secondaryButtonClass}>
          <ArrowLeftRightIcon className="h-4 w-4" />
          Transferência
        </Link>
        <Link href="/parcelamentos/novo" className={secondaryButtonClass}>
          Compra parcelada
        </Link>
      </div>

      <Card className="mb-4">
        <form method="get" className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Link
              href={qs({ mes: addMonthsYM(month, -1) })}
              aria-label="Mês anterior"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              ←
            </Link>
            <span className="min-w-32 text-center text-sm font-semibold capitalize text-slate-800 dark:text-slate-200">
              {formatMonthPT(month)}
            </span>
            <Link
              href={qs({ mes: addMonthsYM(month, 1) })}
              aria-label="Próximo mês"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              →
            </Link>
          </div>
          <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
          <input type="hidden" name="mes" value={month} />
          <select name="origem" defaultValue={sp.origem ?? ""} className={`${selectCompactClass} min-w-36`}>
            <option value="">Todas as origens</option>
            <optgroup label="Contas">
              {accounts.map((a) => (
                <option key={a.id} value={`acc:${a.id}`}>
                  {a.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Cartões">
              {cards.map((c) => (
                <option key={c.id} value={`card:${c.id}`}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          </select>
          <select name="categoria" defaultValue={sp.categoria ?? ""} className={`${selectCompactClass} min-w-36`}>
            <option value="">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select name="situacao" defaultValue={sp.situacao ?? ""} className={`${selectCompactClass}`}>
            <option value="">Pagos e pendentes</option>
            <option value="paid">Pagos</option>
            <option value="pending">Pendentes</option>
          </select>
          <button type="submit" className={secondaryButtonClass}>
            Filtrar
          </button>
        </form>
      </Card>

      <Card>
        <div className="mb-2 flex flex-wrap gap-4 border-b border-slate-100 pb-3 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Entradas: <Money cents={totalIncome} className="font-semibold text-emerald-700 dark:text-emerald-400" />
          </span>
          <span>
            Saídas: <Money cents={totalExpense} className="font-semibold text-red-600 dark:text-red-400" />
          </span>
        </div>
        {txns.length === 0 ? (
          <EmptyState
            message="Nenhum lançamento no período."
            action={{ href: "/lancamentos/novo", label: "Criar lançamento" }}
          />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {txns.map((txn) => {
              const negative = txn.type === "expense" || txn.type === "transfer_out";
              const origin = txn.accountId
                ? accountName.get(txn.accountId)
                : cardName.get(txn.creditCardId ?? "");
              return (
                <li key={txn.id} className="flex flex-wrap items-center gap-3 py-3">
                  <DirectionIcon type={txn.type} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{txn.description}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDateBR(txn.date)} · {origin}
                      {txn.categoryId && ` · ${categoryName.get(txn.categoryId) ?? ""}`}
                      {txn.status === "pending" && (
                        <span className="ml-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 font-medium text-amber-700 dark:text-amber-400">
                          pendente{txn.dueDate ? ` · vence ${formatDateBR(txn.dueDate)}` : ""}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Money
                      cents={negative ? -txn.amountCents : txn.amountCents}
                      signed
                      className="mr-1 text-sm font-semibold"
                    />
                    {txn.status === "pending" && txn.accountId && (
                      <form action={markPaidAction}>
                        <input type="hidden" name="id" value={txn.id} />
                        <button type="submit" className={listActionClass}>
                          Pagar
                        </button>
                      </form>
                    )}
                    {!txn.transferGroupId && (
                      <Link href={`/lancamentos/${txn.id}/editar`} className={ghostActionClass}>
                        Editar
                      </Link>
                    )}
                    <form action={deleteTransactionAction}>
                      <input type="hidden" name="id" value={txn.id} />
                      <ConfirmButton
                        message={
                          txn.transferGroupId
                            ? "Excluir esta transferência? As duas pernas serão removidas."
                            : `Excluir "${txn.description}"?`
                        }
                        className={dangerButtonClass}
                      >
                        Excluir
                      </ConfirmButton>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}

