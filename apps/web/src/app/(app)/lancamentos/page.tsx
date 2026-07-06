import { deleteTransactionAction, markPaidAction } from "@/actions/transactions";
import { ConfirmButton } from "@/components/confirm-button";
import { Money } from "@/components/money";
import { Card, EmptyState, PageHeader, dangerButtonClass, secondaryButtonClass, selectClass } from "@/components/ui";
import { getAccounts, getCards, getCategories } from "@/lib/data";
import { formatDateBR, formatMonthPT } from "@/lib/format";
import { requireFamily } from "@/lib/session";
import { addMonthsYM, daysInMonth, makeDate, monthOfISO, parseYM, todayISO } from "@meusaldo/core";
import { db, schema } from "@meusaldo/db";
import { and, asc, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import Link from "next/link";

const TYPE_LABEL: Record<string, string> = {
  income: "Receita",
  expense: "Despesa",
  transfer_in: "Transf. recebida",
  transfer_out: "Transf. enviada",
};

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

  return (
    <>
      <PageHeader title="Lançamentos" action={{ href: "/lancamentos/novo", label: "Novo lançamento" }} />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/transferencias/nova" className={secondaryButtonClass}>
          Transferência
        </Link>
        <Link href="/parcelamentos/novo" className={secondaryButtonClass}>
          Compra parcelada
        </Link>
      </div>

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Link href={qs({ mes: addMonthsYM(month, -1) })} className="rounded-md border border-slate-200 px-2 py-1 text-sm hover:bg-slate-50">
              ←
            </Link>
            <span className="min-w-36 text-center text-sm font-semibold capitalize">{formatMonthPT(month)}</span>
            <Link href={qs({ mes: addMonthsYM(month, 1) })} className="rounded-md border border-slate-200 px-2 py-1 text-sm hover:bg-slate-50">
              →
            </Link>
          </div>
          <form method="get" className="flex flex-wrap gap-2">
            <input type="hidden" name="mes" value={month} />
            <select name="origem" defaultValue={sp.origem ?? ""} className={`${selectClass} w-auto`}>
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
            <select name="categoria" defaultValue={sp.categoria ?? ""} className={`${selectClass} w-auto`}>
              <option value="">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select name="situacao" defaultValue={sp.situacao ?? ""} className={`${selectClass} w-auto`}>
              <option value="">Pagos e pendentes</option>
              <option value="paid">Pagos</option>
              <option value="pending">Pendentes</option>
            </select>
            <button type="submit" className={secondaryButtonClass}>
              Filtrar
            </button>
          </form>
        </div>
      </Card>

      <Card>
        {txns.length === 0 ? (
          <EmptyState message="Nenhum lançamento no período." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {txns.map((txn) => {
              const negative = txn.type === "expense" || txn.type === "transfer_out";
              const origin = txn.accountId
                ? accountName.get(txn.accountId)
                : cardName.get(txn.creditCardId ?? "");
              return (
                <li key={txn.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{txn.description}</p>
                    <p className="text-xs text-slate-400">
                      {formatDateBR(txn.date)} · {origin} · {TYPE_LABEL[txn.type]}
                      {txn.categoryId && ` · ${categoryName.get(txn.categoryId) ?? ""}`}
                      {txn.status === "pending" && (
                        <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-amber-700">
                          pendente{txn.dueDate ? ` · vence ${formatDateBR(txn.dueDate)}` : ""}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Money cents={negative ? -txn.amountCents : txn.amountCents} signed className="text-sm font-semibold" />
                    {txn.status === "pending" && txn.accountId && (
                      <form action={markPaidAction}>
                        <input type="hidden" name="id" value={txn.id} />
                        <button type="submit" className="text-xs font-medium text-emerald-700 hover:underline">
                          Marcar pago
                        </button>
                      </form>
                    )}
                    {!txn.transferGroupId && (
                      <Link href={`/lancamentos/${txn.id}/editar`} className="text-xs text-slate-500 hover:text-emerald-700">
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
