"use server";

import { getDate, getMoneyCents, getOptionalString, getSource, getString } from "@/lib/forms";
import { assertFamilyOwns } from "@/lib/guards";
import { requireFamily } from "@/lib/session";
import { createTransfer } from "@meusaldo/core";
import { db, schema } from "@meusaldo/db";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function revalidateFinance() {
  revalidatePath("/");
  revalidatePath("/lancamentos");
  revalidatePath("/cartoes");
}

async function parseCommonFields(formData: FormData, familyId: string) {
  const type = getString(formData, "type");
  if (type !== "income" && type !== "expense") throw new Error("Tipo inválido");

  const { accountId, creditCardId } = getSource(formData);
  if (accountId) await assertFamilyOwns(schema.bankAccounts, accountId, familyId);
  if (creditCardId) await assertFamilyOwns(schema.creditCards, creditCardId, familyId);

  const categoryId = getOptionalString(formData, "categoryId");
  if (categoryId) await assertFamilyOwns(schema.categories, categoryId, familyId);

  const date = getDate(formData, "date");
  // Cartão: sempre pendente até o pagamento da fatura. Conta: escolha do usuário.
  const status = creditCardId
    ? ("pending" as const)
    : getOptionalString(formData, "status") === "pending"
      ? ("pending" as const)
      : ("paid" as const);
  const dueDate =
    status === "pending" && accountId ? (getOptionalString(formData, "dueDate") ?? date) : null;

  return {
    description: getString(formData, "description"),
    amountCents: getMoneyCents(formData, "amount"),
    type: type as "income" | "expense",
    status,
    date,
    dueDate,
    accountId,
    creditCardId,
    categoryId,
  };
}

export async function createTransactionAction(formData: FormData) {
  const user = await requireFamily();
  const fields = await parseCommonFields(formData, user.familyId);
  await db.insert(schema.transactions).values({
    familyId: user.familyId,
    createdBy: user.id,
    ...fields,
  });
  revalidateFinance();
  redirect(getOptionalString(formData, "returnTo") ?? "/lancamentos");
}

export async function updateTransactionAction(formData: FormData) {
  const user = await requireFamily();
  const id = getString(formData, "id");
  await assertFamilyOwns(schema.transactions, id, user.familyId);
  const fields = await parseCommonFields(formData, user.familyId);
  await db
    .update(schema.transactions)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(schema.transactions.id, id));
  revalidateFinance();
  redirect(getOptionalString(formData, "returnTo") ?? "/lancamentos");
}

export async function markPaidAction(formData: FormData) {
  const user = await requireFamily();
  const id = getString(formData, "id");
  await assertFamilyOwns(schema.transactions, id, user.familyId);
  await db
    .update(schema.transactions)
    .set({ status: "paid", updatedAt: new Date() })
    .where(eq(schema.transactions.id, id));
  revalidateFinance();
}

export async function deleteTransactionAction(formData: FormData) {
  const user = await requireFamily();
  const id = getString(formData, "id");
  const [txn] = await db
    .select()
    .from(schema.transactions)
    .where(and(eq(schema.transactions.id, id), eq(schema.transactions.familyId, user.familyId)));
  if (!txn) throw new Error("Lançamento não encontrado");

  if (txn.transferGroupId) {
    // transferência: remove as duas pernas
    await db
      .delete(schema.transactions)
      .where(eq(schema.transactions.transferGroupId, txn.transferGroupId));
  } else {
    await db.delete(schema.transactions).where(eq(schema.transactions.id, id));
  }
  revalidateFinance();
}

export async function createTransferAction(formData: FormData) {
  const user = await requireFamily();
  const fromAccountId = getString(formData, "fromAccountId");
  const toAccountId = getString(formData, "toAccountId");
  await assertFamilyOwns(schema.bankAccounts, fromAccountId, user.familyId);
  await assertFamilyOwns(schema.bankAccounts, toAccountId, user.familyId);

  await createTransfer(db, {
    familyId: user.familyId,
    fromAccountId,
    toAccountId,
    amountCents: getMoneyCents(formData, "amount"),
    date: getDate(formData, "date"),
    description: getOptionalString(formData, "description") ?? undefined,
    userId: user.id,
  });
  revalidateFinance();
  redirect("/lancamentos");
}
