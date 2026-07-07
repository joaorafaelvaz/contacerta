import { deleteBudgetAction, upsertBudgetAction } from "@/actions/budgets";
import { ConfirmButton } from "@/components/confirm-button";
import { Money } from "@/components/money";
import { Card, EmptyState, PageHeader, dangerButtonClass, inputClass, primaryButtonClass, selectClass } from "@/components/ui";
import { getCategories } from "@/lib/data";
import { formatMonthPT } from "@/lib/format";
import { requireFamily } from "@/lib/session";
import { addMonthsYM, getBudgetUsage, monthOfISO, todayISO } from "@meusaldo/core";
import { db } from "@meusaldo/db";
import Link from "next/link";

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const user = await requireFamily();
  const { mes } = await searchParams;
  const currentMonth = monthOfISO(todayISO());
  const month = mes && /^\d{4}-\d{2}$/.test(mes) ? mes : currentMonth;

  const [usage, categories] = await Promise.all([
    getBudgetUsage(db, user.familyId, month),
    getCategories(user.familyId),
  ]);
  const expenseCategories = categories.filter((c) => c.type === "expense");

  return (
    <>
      <PageHeader title="Orçamentos" />

      <Card className="mb-4">
        <div className="flex items-center justify-center gap-2">
          <Link
            href={`/orcamentos?mes=${addMonthsYM(month, -1)}`}
            className="rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            ←
          </Link>
          <span className="min-w-40 text-center font-semibold capitalize">{formatMonthPT(month)}</span>
          <Link
            href={`/orcamentos?mes=${addMonthsYM(month, 1)}`}
            className="rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            →
          </Link>
        </div>
      </Card>

      <Card title="Definir meta do mês" className="mb-4">
        <form action={upsertBudgetAction} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="month" value={month} />
          <select name="categoryId" required className={`${selectClass} max-w-60`}>
            <option value="">Categoria...</option>
            {expenseCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <input name="amount" required placeholder="Meta (R$)" className={`${inputClass} max-w-40`} />
          <button type="submit" className={primaryButtonClass}>
            Salvar meta
          </button>
        </form>
      </Card>

      <Card title="Acompanhamento">
        {usage.length === 0 ? (
          <EmptyState message="Nenhuma meta definida para este mês." />
        ) : (
          <ul className="space-y-4">
            {usage.map((item) => {
              const pct = Math.min(100, Math.round((item.spentCents / item.budgetCents) * 100));
              const over = item.spentCents > item.budgetCents;
              return (
                <li key={item.budgetId}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{item.categoryName}</span>
                    <span className={over ? "font-semibold text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}>
                      <Money cents={item.spentCents} /> / <Money cents={item.budgetCents} />
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${over ? "bg-red-500" : "bg-emerald-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <form action={deleteBudgetAction} className="mt-1 text-right">
                    <input type="hidden" name="id" value={item.budgetId} />
                    <ConfirmButton message="Remover esta meta?" className={dangerButtonClass}>
                      Remover
                    </ConfirmButton>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
