"use server";

import { getMoneyCents, getOptionalString, getString } from "@/lib/forms";
import { assertFamilyOwns } from "@/lib/guards";
import { requireFamily } from "@/lib/session";
import { parseAmountToCents } from "@meusaldo/core";
import { db, schema } from "@meusaldo/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const ACCOUNT_TYPES = ["checking", "savings", "wallet", "investment"] as const;

function parseType(form: FormData) {
  const type = getString(form, "type") as (typeof ACCOUNT_TYPES)[number];
  if (!ACCOUNT_TYPES.includes(type)) throw new Error("Tipo de conta inválido");
  return type;
}

function parseInitialBalance(form: FormData): number {
  const raw = getOptionalString(form, "initialBalance");
  if (!raw) return 0;
  const negative = raw.trim().startsWith("-");
  const cents = parseAmountToCents(raw.replace(/^-/, ""));
  return negative ? -cents : cents;
}

export async function createAccountAction(formData: FormData) {
  const user = await requireFamily();
  await db.insert(schema.bankAccounts).values({
    familyId: user.familyId,
    name: getString(formData, "name"),
    type: parseType(formData),
    initialBalanceCents: parseInitialBalance(formData),
  });
  revalidatePath("/contas");
  redirect("/contas");
}

export async function updateAccountAction(formData: FormData) {
  const user = await requireFamily();
  const id = getString(formData, "id");
  await assertFamilyOwns(schema.bankAccounts, id, user.familyId);
  await db
    .update(schema.bankAccounts)
    .set({
      name: getString(formData, "name"),
      type: parseType(formData),
      initialBalanceCents: parseInitialBalance(formData),
    })
    .where(eq(schema.bankAccounts.id, id));
  revalidatePath("/contas");
  redirect("/contas");
}

export async function archiveAccountAction(formData: FormData) {
  const user = await requireFamily();
  const id = getString(formData, "id");
  await assertFamilyOwns(schema.bankAccounts, id, user.familyId);
  await db
    .update(schema.bankAccounts)
    .set({ archived: true })
    .where(eq(schema.bankAccounts.id, id));
  revalidatePath("/contas");
}
