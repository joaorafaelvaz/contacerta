"use server";

import { getInt, getMoneyCents, getOptionalString, getSource, getString } from "@/lib/forms";
import { assertFamilyOwns } from "@/lib/guards";
import { requireFamily } from "@/lib/session";
import { db, schema } from "@meusaldo/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createRecurringRuleAction(formData: FormData) {
  const user = await requireFamily();
  const type = getString(formData, "type");
  if (type !== "income" && type !== "expense") throw new Error("Tipo inválido");

  const { accountId, creditCardId } = getSource(formData);
  if (accountId) await assertFamilyOwns(schema.bankAccounts, accountId, user.familyId);
  if (creditCardId) await assertFamilyOwns(schema.creditCards, creditCardId, user.familyId);

  const categoryId = getOptionalString(formData, "categoryId");
  if (categoryId) await assertFamilyOwns(schema.categories, categoryId, user.familyId);

  const dayOfMonth = getInt(formData, "dayOfMonth");
  if (dayOfMonth < 1 || dayOfMonth > 31) throw new Error("Dia entre 1 e 31");

  await db.insert(schema.recurringRules).values({
    familyId: user.familyId,
    description: getString(formData, "description"),
    amountCents: getMoneyCents(formData, "amount"),
    type,
    dayOfMonth,
    accountId,
    creditCardId,
    categoryId,
  });
  revalidatePath("/recorrencias");
  redirect("/recorrencias");
}

export async function toggleRecurringRuleAction(formData: FormData) {
  const user = await requireFamily();
  const id = getString(formData, "id");
  await assertFamilyOwns(schema.recurringRules, id, user.familyId);
  const [rule] = await db
    .select()
    .from(schema.recurringRules)
    .where(eq(schema.recurringRules.id, id));
  if (!rule) return;
  await db
    .update(schema.recurringRules)
    .set({ active: !rule.active })
    .where(eq(schema.recurringRules.id, id));
  revalidatePath("/recorrencias");
}

export async function deleteRecurringRuleAction(formData: FormData) {
  const user = await requireFamily();
  const id = getString(formData, "id");
  await assertFamilyOwns(schema.recurringRules, id, user.familyId);
  // remove só as ocorrências futuras ainda pendentes; histórico pago fica
  await db.delete(schema.recurringRules).where(eq(schema.recurringRules.id, id));
  revalidatePath("/recorrencias");
  revalidatePath("/lancamentos");
}
