import {
  createInstallmentPurchase,
  daysInMonth,
  makeDate,
  parseYM,
  todayISO,
} from "@meusaldo/core";
import { db, schema } from "@meusaldo/db";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const yearMonth = z.string().regex(/^\d{4}-\d{2}$/);

const sourceSchema = z.object({
  kind: z.enum(["account", "card"]),
  id: z.string().uuid(),
});

async function assertOwns(
  table:
    | typeof schema.bankAccounts
    | typeof schema.creditCards
    | typeof schema.categories
    | typeof schema.transactions,
  id: string,
  familyId: string,
) {
  const [row] = await db
    .select({ id: table.id })
    .from(table)
    .where(and(eq(table.id, id), eq(table.familyId, familyId)));
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Registro não encontrado" });
}

async function assertSource(source: z.infer<typeof sourceSchema>, familyId: string) {
  await assertOwns(
    source.kind === "account" ? schema.bankAccounts : schema.creditCards,
    source.id,
    familyId,
  );
}

const createInput = z.object({
  description: z.string().min(1).max(200),
  amountCents: z.number().int().positive(),
  type: z.enum(["income", "expense"]),
  date: isoDate.optional(),
  source: sourceSchema,
  categoryId: z.string().uuid().nullish(),
  pending: z.boolean().default(false),
  dueDate: isoDate.nullish(),
  /** >1 exige source.kind === "card": vira compra parcelada */
  installments: z.number().int().min(1).max(60).default(1),
});

export const transactionsRouter = router({
  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [txn] = await db
        .select()
        .from(schema.transactions)
        .where(
          and(
            eq(schema.transactions.id, input.id),
            eq(schema.transactions.familyId, ctx.user.familyId),
          ),
        );
      if (!txn) throw new TRPCError({ code: "NOT_FOUND" });
      return txn;
    }),

  list: protectedProcedure
    .input(
      z.object({
        month: yearMonth,
        source: sourceSchema.optional(),
        categoryId: z.string().uuid().optional(),
        status: z.enum(["paid", "pending"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { year, month } = parseYM(input.month);
      const filters: SQL[] = [
        eq(schema.transactions.familyId, ctx.user.familyId),
        gte(schema.transactions.date, makeDate(year, month, 1)),
        lte(schema.transactions.date, makeDate(year, month, daysInMonth(year, month))),
      ];
      if (input.source?.kind === "account")
        filters.push(eq(schema.transactions.accountId, input.source.id));
      if (input.source?.kind === "card")
        filters.push(eq(schema.transactions.creditCardId, input.source.id));
      if (input.categoryId) filters.push(eq(schema.transactions.categoryId, input.categoryId));
      if (input.status) filters.push(eq(schema.transactions.status, input.status));

      return db
        .select({
          txn: schema.transactions,
          accountName: schema.bankAccounts.name,
          cardName: schema.creditCards.name,
          categoryName: schema.categories.name,
        })
        .from(schema.transactions)
        .leftJoin(schema.bankAccounts, eq(schema.transactions.accountId, schema.bankAccounts.id))
        .leftJoin(schema.creditCards, eq(schema.transactions.creditCardId, schema.creditCards.id))
        .leftJoin(schema.categories, eq(schema.transactions.categoryId, schema.categories.id))
        .where(and(...filters))
        .orderBy(desc(schema.transactions.date), desc(schema.transactions.createdAt));
    }),

  create: protectedProcedure.input(createInput).mutation(async ({ ctx, input }) => {
    const familyId = ctx.user.familyId;
    await assertSource(input.source, familyId);
    if (input.categoryId) await assertOwns(schema.categories, input.categoryId, familyId);
    const date = input.date ?? todayISO();

    if (input.installments > 1) {
      if (input.source.kind !== "card" || input.type !== "expense") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Parcelamento exige despesa em cartão de crédito",
        });
      }
      const [card] = await db
        .select()
        .from(schema.creditCards)
        .where(eq(schema.creditCards.id, input.source.id));
      await createInstallmentPurchase(db, {
        familyId,
        card: card!,
        description: input.description,
        totalCents: input.amountCents,
        installments: input.installments,
        purchaseDate: date,
        categoryId: input.categoryId ?? null,
        userId: ctx.user.id,
      });
      return { ok: true };
    }

    const isCard = input.source.kind === "card";
    const pending = isCard ? true : input.pending;
    await db.insert(schema.transactions).values({
      familyId,
      description: input.description,
      amountCents: input.amountCents,
      type: input.type,
      status: pending ? "pending" : "paid",
      date,
      dueDate: pending && !isCard ? (input.dueDate ?? date) : null,
      accountId: isCard ? null : input.source.id,
      creditCardId: isCard ? input.source.id : null,
      categoryId: input.categoryId ?? null,
      createdBy: ctx.user.id,
    });
    return { ok: true };
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        description: z.string().min(1).max(200),
        amountCents: z.number().int().positive(),
        type: z.enum(["income", "expense"]),
        date: isoDate,
        source: sourceSchema,
        categoryId: z.string().uuid().nullish(),
        pending: z.boolean(),
        dueDate: isoDate.nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const familyId = ctx.user.familyId;
      await assertOwns(schema.transactions, input.id, familyId);
      await assertSource(input.source, familyId);
      if (input.categoryId) await assertOwns(schema.categories, input.categoryId, familyId);

      const isCard = input.source.kind === "card";
      const pending = isCard ? true : input.pending;
      await db
        .update(schema.transactions)
        .set({
          description: input.description,
          amountCents: input.amountCents,
          type: input.type,
          date: input.date,
          status: pending ? "pending" : "paid",
          dueDate: pending && !isCard ? (input.dueDate ?? input.date) : null,
          accountId: isCard ? null : input.source.id,
          creditCardId: isCard ? input.source.id : null,
          categoryId: input.categoryId ?? null,
          updatedAt: new Date(),
        })
        .where(eq(schema.transactions.id, input.id));
      return { ok: true };
    }),

  markPaid: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await assertOwns(schema.transactions, input.id, ctx.user.familyId);
      await db
        .update(schema.transactions)
        .set({ status: "paid", updatedAt: new Date() })
        .where(eq(schema.transactions.id, input.id));
      return { ok: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [txn] = await db
        .select()
        .from(schema.transactions)
        .where(
          and(
            eq(schema.transactions.id, input.id),
            eq(schema.transactions.familyId, ctx.user.familyId),
          ),
        );
      if (!txn) throw new TRPCError({ code: "NOT_FOUND" });
      if (txn.transferGroupId) {
        await db
          .delete(schema.transactions)
          .where(eq(schema.transactions.transferGroupId, txn.transferGroupId));
      } else {
        await db.delete(schema.transactions).where(eq(schema.transactions.id, input.id));
      }
      return { ok: true };
    }),
});
