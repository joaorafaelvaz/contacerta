import { type Db, schema } from "@meusaldo/db";
import { and, eq } from "drizzle-orm";
import { addMonthsYM, type YearMonth } from "../dates";
import { occurrenceDate } from "../recurrence";

/**
 * Materializa como transações pendentes as ocorrências das regras ativas na
 * competência dada. Idempotente: o índice único (recurring_rule_id, competence)
 * garante que rodar de novo não duplica.
 */
export async function materializeRecurringForMonth(
  db: Db,
  familyId: string,
  competence: YearMonth,
): Promise<void> {
  const rules = await db
    .select()
    .from(schema.recurringRules)
    .where(and(eq(schema.recurringRules.familyId, familyId), eq(schema.recurringRules.active, true)));

  if (rules.length === 0) return;

  const values = rules.map((rule) => {
    const date = occurrenceDate(rule.dayOfMonth, competence);
    return {
      familyId,
      description: rule.description,
      amountCents: rule.amountCents,
      type: rule.type === "income" ? ("income" as const) : ("expense" as const),
      status: "pending" as const,
      date,
      dueDate: date,
      accountId: rule.accountId,
      creditCardId: rule.creditCardId,
      categoryId: rule.categoryId,
      recurringRuleId: rule.id,
      competence,
    };
  });

  await db.insert(schema.transactions).values(values).onConflictDoNothing();
}

/** Materializa o mês corrente e o seguinte (para o painel de vencimentos). */
export async function materializeUpcoming(
  db: Db,
  familyId: string,
  currentMonth: YearMonth,
): Promise<void> {
  await materializeRecurringForMonth(db, familyId, currentMonth);
  await materializeRecurringForMonth(db, familyId, addMonthsYM(currentMonth, 1));
}
