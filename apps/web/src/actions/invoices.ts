"use server";

import { getDate, getString } from "@/lib/forms";
import { assertFamilyOwns } from "@/lib/guards";
import { requireFamily } from "@/lib/session";
import { payInvoice } from "@meusaldo/core";
import { db, schema } from "@meusaldo/db";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function payInvoiceAction(formData: FormData) {
  const user = await requireFamily();
  const cardId = getString(formData, "cardId");
  const cycle = getString(formData, "cycle");
  if (!/^\d{4}-\d{2}$/.test(cycle)) throw new Error("Competência inválida");

  const [card] = await db
    .select()
    .from(schema.creditCards)
    .where(and(eq(schema.creditCards.id, cardId), eq(schema.creditCards.familyId, user.familyId)));
  if (!card) throw new Error("Cartão não encontrado");

  const accountId = getString(formData, "accountId");
  await assertFamilyOwns(schema.bankAccounts, accountId, user.familyId);

  await payInvoice(db, {
    card,
    cycle,
    accountId,
    date: getDate(formData, "date"),
    userId: user.id,
  });

  revalidatePath("/");
  revalidatePath("/lancamentos");
  redirect(`/cartoes/${card.id}?ciclo=${cycle}`);
}
