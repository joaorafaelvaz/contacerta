import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
};

const connectionString =
  process.env.DATABASE_URL ?? "postgres://meusaldo:meusaldo@localhost:5434/meusaldo";

// Reaproveita a conexão em dev (hot reload do Next.js cria muitos módulos)
const client = globalForDb.pgClient ?? postgres(connectionString, { max: 10 });
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
export { DEFAULT_CATEGORIES } from "./default-categories";
export type Db = typeof db;
export * as schema from "./schema";

export type Transaction = typeof schema.transactions.$inferSelect;
export type NewTransaction = typeof schema.transactions.$inferInsert;
export type BankAccount = typeof schema.bankAccounts.$inferSelect;
export type CreditCard = typeof schema.creditCards.$inferSelect;
export type Category = typeof schema.categories.$inferSelect;
export type Budget = typeof schema.budgets.$inferSelect;
export type RecurringRule = typeof schema.recurringRules.$inferSelect;
export type InstallmentPurchase = typeof schema.installmentPurchases.$inferSelect;
export type Family = typeof schema.families.$inferSelect;
