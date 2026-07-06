import { type Db, schema } from "@meusaldo/db";
import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { daysInMonth, makeDate, parseYM, type YearMonth } from "../dates";

export interface BudgetUsage {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  budgetCents: number;
  spentCents: number;
}

/** Consumo do orçamento: despesas pagas + pendentes da categoria no mês. */
export async function getBudgetUsage(
  db: Db,
  familyId: string,
  month: YearMonth,
): Promise<BudgetUsage[]> {
  const budgets = await db
    .select({
      budgetId: schema.budgets.id,
      categoryId: schema.budgets.categoryId,
      categoryName: schema.categories.name,
      budgetCents: schema.budgets.amountCents,
    })
    .from(schema.budgets)
    .innerJoin(schema.categories, eq(schema.budgets.categoryId, schema.categories.id))
    .where(and(eq(schema.budgets.familyId, familyId), eq(schema.budgets.month, month)));

  if (budgets.length === 0) return [];

  const { year, month: m } = parseYM(month);
  const start = makeDate(year, m, 1);
  const end = makeDate(year, m, daysInMonth(year, m));

  const spent = await db
    .select({
      categoryId: schema.transactions.categoryId,
      total: sql<string>`coalesce(sum(${schema.transactions.amountCents}), 0)`,
    })
    .from(schema.transactions)
    .where(
      and(
        eq(schema.transactions.familyId, familyId),
        eq(schema.transactions.type, "expense"),
        gte(schema.transactions.date, start),
        lte(schema.transactions.date, end),
        inArray(
          schema.transactions.categoryId,
          budgets.map((b) => b.categoryId),
        ),
      ),
    )
    .groupBy(schema.transactions.categoryId);

  const spentByCategory = new Map(spent.map((s) => [s.categoryId, Number(s.total)]));
  return budgets.map((b) => ({
    ...b,
    spentCents: spentByCategory.get(b.categoryId) ?? 0,
  }));
}
