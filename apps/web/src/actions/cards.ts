"use server";

import { getInt, getMoneyCents, getOptionalString, getString } from "@/lib/forms";
import { assertFamilyOwns } from "@/lib/guards";
import { requireFamily } from "@/lib/session";
import { db, schema } from "@meusaldo/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseDays(form: FormData) {
  const closingDay = getInt(form, "closingDay");
  const dueDay = getInt(form, "dueDay");
  if (closingDay < 1 || closingDay > 31) throw new Error("Dia de fechamento entre 1 e 31");
  if (dueDay < 1 || dueDay > 31) throw new Error("Dia de vencimento entre 1 e 31");
  return { closingDay, dueDay };
}

export async function createCardAction(formData: FormData) {
  const user = await requireFamily();
  const paymentAccountId = getOptionalString(formData, "paymentAccountId");
  if (paymentAccountId) {
    await assertFamilyOwns(schema.bankAccounts, paymentAccountId, user.familyId);
  }
  await db.insert(schema.creditCards).values({
    familyId: user.familyId,
    name: getString(formData, "name"),
    limitCents: getMoneyCents(formData, "limit"),
    ...parseDays(formData),
    paymentAccountId,
  });
  revalidatePath("/cartoes");
  redirect("/cartoes");
}

export async function updateCardAction(formData: FormData) {
  const user = await requireFamily();
  const id = getString(formData, "id");
  await assertFamilyOwns(schema.creditCards, id, user.familyId);
  const paymentAccountId = getOptionalString(formData, "paymentAccountId");
  if (paymentAccountId) {
    await assertFamilyOwns(schema.bankAccounts, paymentAccountId, user.familyId);
  }
  await db
    .update(schema.creditCards)
    .set({
      name: getString(formData, "name"),
      limitCents: getMoneyCents(formData, "limit"),
      ...parseDays(formData),
      paymentAccountId,
    })
    .where(eq(schema.creditCards.id, id));
  revalidatePath("/cartoes");
  redirect("/cartoes");
}

export async function archiveCardAction(formData: FormData) {
  const user = await requireFamily();
  const id = getString(formData, "id");
  await assertFamilyOwns(schema.creditCards, id, user.familyId);
  await db.update(schema.creditCards).set({ archived: true }).where(eq(schema.creditCards.id, id));
  revalidatePath("/cartoes");
  redirect("/cartoes");
}
