import { type BankAccount, type Db, schema } from "@meusaldo/db";
import { and, asc, eq, isNotNull, sql } from "drizzle-orm";

export interface AccountWithBalance extends BankAccount {
  balanceCents: number;
}

/** Saldo derivado: inicial + entradas pagas − saídas pagas (por conta). */
export async function getAccountsWithBalances(
  db: Db,
  familyId: string,
): Promise<AccountWithBalance[]> {
  const accounts = await db
    .select()
    .from(schema.bankAccounts)
    .where(and(eq(schema.bankAccounts.familyId, familyId), eq(schema.bankAccounts.archived, false)))
    .orderBy(asc(schema.bankAccounts.createdAt));

  const deltas = await db
    .select({
      accountId: schema.transactions.accountId,
      delta: sql<string>`coalesce(sum(
        case when ${schema.transactions.type} in ('income', 'transfer_in')
          then ${schema.transactions.amountCents}
          else -${schema.transactions.amountCents}
        end), 0)`,
    })
    .from(schema.transactions)
    .where(
      and(
        eq(schema.transactions.familyId, familyId),
        eq(schema.transactions.status, "paid"),
        isNotNull(schema.transactions.accountId),
      ),
    )
    .groupBy(schema.transactions.accountId);

  const deltaByAccount = new Map(deltas.map((d) => [d.accountId, Number(d.delta)]));
  return accounts.map((acc) => ({
    ...acc,
    balanceCents: acc.initialBalanceCents + (deltaByAccount.get(acc.id) ?? 0),
  }));
}
