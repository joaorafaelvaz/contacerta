import { db, schema } from "@meusaldo/db";
import { and, eq } from "drizzle-orm";

type FamilyTable =
  | typeof schema.bankAccounts
  | typeof schema.creditCards
  | typeof schema.categories
  | typeof schema.budgets
  | typeof schema.transactions
  | typeof schema.recurringRules
  | typeof schema.installmentPurchases;

/** Garante que o registro existe e pertence à família do usuário. */
export async function assertFamilyOwns(table: FamilyTable, id: string, familyId: string) {
  const [row] = await db
    .select({ id: table.id })
    .from(table)
    .where(and(eq(table.id, id), eq(table.familyId, familyId)));
  if (!row) throw new Error("Registro não encontrado");
}
