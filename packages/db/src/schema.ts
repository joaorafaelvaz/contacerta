import { sql } from "drizzle-orm";
import {
  boolean,
  char,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Família
// ---------------------------------------------------------------------------

export const families = pgTable("families", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const familyInvites = pgTable("family_invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  createdBy: text("created_by").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Auth (better-auth) — tabelas user/session/account/verification
// "account" do better-auth é credencial de login, não conta bancária.
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  phone: text("phone").unique(), // dígitos com DDI (ex: 5511999999999), vínculo do WhatsApp
  familyId: uuid("family_id").references(() => families.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const authAccounts = pgTable("auth_accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Financeiro
// ---------------------------------------------------------------------------

export const categoryType = pgEnum("category_type", ["income", "expense"]);
export const transactionType = pgEnum("transaction_type", [
  "income",
  "expense",
  "transfer_in",
  "transfer_out",
]);
export const transactionStatus = pgEnum("transaction_status", ["paid", "pending"]);
export const bankAccountType = pgEnum("bank_account_type", [
  "checking",
  "savings",
  "wallet",
  "investment",
]);

export const bankAccounts = pgTable("bank_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: bankAccountType("type").notNull().default("checking"),
  initialBalanceCents: integer("initial_balance_cents").notNull().default(0),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const creditCards = pgTable(
  "credit_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    limitCents: integer("limit_cents").notNull().default(0),
    closingDay: integer("closing_day").notNull(),
    dueDay: integer("due_day").notNull(),
    paymentAccountId: uuid("payment_account_id").references(() => bankAccounts.id, {
      onDelete: "set null",
    }),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    check("cc_closing_day_range", sql`${t.closingDay} BETWEEN 1 AND 31`),
    check("cc_due_day_range", sql`${t.dueDay} BETWEEN 1 AND 31`),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: categoryType("type").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("categories_family_name_type_uq").on(t.familyId, t.name, t.type)],
);

export const budgets = pgTable(
  "budgets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    month: char("month", { length: 7 }).notNull(), // YYYY-MM
    amountCents: integer("amount_cents").notNull(),
  },
  (t) => [
    uniqueIndex("budgets_family_category_month_uq").on(t.familyId, t.categoryId, t.month),
    check("budget_amount_positive", sql`${t.amountCents} > 0`),
  ],
);

export const installmentPurchases = pgTable("installment_purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  totalAmountCents: integer("total_amount_cents").notNull(),
  installments: integer("installments").notNull(),
  creditCardId: uuid("credit_card_id")
    .notNull()
    .references(() => creditCards.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  purchaseDate: date("purchase_date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const recurringRules = pgTable(
  "recurring_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    amountCents: integer("amount_cents").notNull(),
    type: categoryType("type").notNull(), // income | expense
    dayOfMonth: integer("day_of_month").notNull(),
    accountId: uuid("account_id").references(() => bankAccounts.id, { onDelete: "cascade" }),
    creditCardId: uuid("credit_card_id").references(() => creditCards.id, {
      onDelete: "cascade",
    }),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    check("rr_account_xor_card", sql`(${t.accountId} IS NULL) <> (${t.creditCardId} IS NULL)`),
    check("rr_day_range", sql`${t.dayOfMonth} BETWEEN 1 AND 31`),
    check("rr_amount_positive", sql`${t.amountCents} > 0`),
  ],
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    familyId: uuid("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    amountCents: integer("amount_cents").notNull(),
    type: transactionType("type").notNull(),
    status: transactionStatus("status").notNull().default("paid"),
    date: date("date", { mode: "string" }).notNull(),
    dueDate: date("due_date", { mode: "string" }),
    accountId: uuid("account_id").references(() => bankAccounts.id, { onDelete: "cascade" }),
    creditCardId: uuid("credit_card_id").references(() => creditCards.id, {
      onDelete: "cascade",
    }),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    installmentPurchaseId: uuid("installment_purchase_id").references(
      () => installmentPurchases.id,
      { onDelete: "cascade" },
    ),
    installmentNumber: integer("installment_number"),
    recurringRuleId: uuid("recurring_rule_id").references(() => recurringRules.id, {
      onDelete: "set null",
    }),
    competence: char("competence", { length: 7 }), // YYYY-MM, usado por recorrências
    transferGroupId: uuid("transfer_group_id"),
    externalId: text("external_id"), // conciliação Open Finance (fase futura)
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    check("tx_account_xor_card", sql`(${t.accountId} IS NULL) <> (${t.creditCardId} IS NULL)`),
    check("tx_amount_positive", sql`${t.amountCents} > 0`),
    check(
      "tx_transfer_needs_account",
      sql`${t.type} NOT IN ('transfer_in', 'transfer_out') OR ${t.accountId} IS NOT NULL`,
    ),
    uniqueIndex("tx_recurring_competence_uq")
      .on(t.recurringRuleId, t.competence)
      .where(sql`${t.recurringRuleId} IS NOT NULL`),
    index("tx_family_date_idx").on(t.familyId, t.date),
    index("tx_card_date_idx").on(t.creditCardId, t.date),
    index("tx_account_idx").on(t.accountId),
    index("tx_due_date_idx").on(t.familyId, t.status, t.dueDate),
  ],
);
