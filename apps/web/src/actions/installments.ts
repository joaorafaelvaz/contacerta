"use server";

import { getDate, getInt, getMoneyCents, getOptionalString, getString } from "@/lib/forms";
import { assertFamilyOwns } from "@/lib/guards";
import { requireFamily } from "@/lib/session";
import { createInstallmentPurchase } from "@meusaldo/core";
import { db, schema } from "@meusaldo/db";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createInstallmentPurchaseAction(formData: FormData) {
  const user = await requireFamily();
  const cardId = getString(formData, "creditCardId");
  const [card] = await db
    .select()
    .from(schema.creditCards)
    .where(and(eq(schema.creditCards.id, cardId), eq(schema.creditCards.familyId, user.familyId)));
  if (!card) throw new Error("Cartão não encontrado");

  const categoryId = getOptionalString(formData, "categoryId");
  if (categoryId) await assertFamilyOwns(schema.categories, categoryId, user.familyId);

  const installments = getInt(formData, "installments");
  if (installments < 1 || installments > 60) throw new Error("Parcelas entre 1 e 60");

  await createInstallmentPurchase(db, {
    familyId: user.familyId,
    card,
    description: getString(formData, "description"),
    totalCents: getMoneyCents(formData, "total"),
    installments,
    purchaseDate: getDate(formData, "purchaseDate"),
    categoryId,
    userId: user.id,
  });

  revalidatePath("/lancamentos");
  revalidatePath("/cartoes");
  redirect(`/cartoes/${card.id}`);
}
