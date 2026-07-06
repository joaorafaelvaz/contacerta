"use server";

import { getMoneyCents, getString } from "@/lib/forms";
import { assertFamilyOwns } from "@/lib/guards";
import { requireFamily } from "@/lib/session";
import { db, schema } from "@meusaldo/db";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function upsertBudgetAction(formData: FormData) {
  const user = await requireFamily();
  const categoryId = getString(formData, "categoryId");
  const month = getString(formData, "month");
  if (!/^\d{4}-\d{2}$/.test(month)) throw new Error("Mês inválido");
  await assertFamilyOwns(schema.categories, categoryId, user.familyId);

  const amountCents = getMoneyCents(formData, "amount");
  await db
    .insert(schema.budgets)
    .values({ familyId: user.familyId, categoryId, month, amountCents })
    .onConflictDoUpdate({
      target: [schema.budgets.familyId, schema.budgets.categoryId, schema.budgets.month],
      set: { amountCents: sql`excluded.amount_cents` },
    });
  revalidatePath("/orcamentos");
}

export async function deleteBudgetAction(formData: FormData) {
  const user = await requireFamily();
  const id = getString(formData, "id");
  await assertFamilyOwns(schema.budgets, id, user.familyId);
  await db.delete(schema.budgets).where(eq(schema.budgets.id, id));
  revalidatePath("/orcamentos");
}
