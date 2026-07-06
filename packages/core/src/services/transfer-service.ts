import { type Db, schema } from "@meusaldo/db";
import type { ISODate } from "../dates";

/** Transferência entre contas = par de transações ligadas por transfer_group_id. */
export async function createTransfer(
  db: Db,
  input: {
    familyId: string;
    fromAccountId: string;
    toAccountId: string;
    amountCents: number;
    date: ISODate;
    description?: string;
    userId?: string;
  },
): Promise<void> {
  if (input.fromAccountId === input.toAccountId) {
    throw new Error("Transferência exige contas de origem e destino diferentes");
  }
  const groupId = crypto.randomUUID();
  const description = input.description?.trim() || "Transferência";

  await db.insert(schema.transactions).values([
    {
      familyId: input.familyId,
      description,
      amountCents: input.amountCents,
      type: "transfer_out",
      status: "paid",
      date: input.date,
      accountId: input.fromAccountId,
      transferGroupId: groupId,
      createdBy: input.userId ?? null,
    },
    {
      familyId: input.familyId,
      description,
      amountCents: input.amountCents,
      type: "transfer_in",
      status: "paid",
      date: input.date,
      accountId: input.toAccountId,
      transferGroupId: groupId,
      createdBy: input.userId ?? null,
    },
  ]);
}
