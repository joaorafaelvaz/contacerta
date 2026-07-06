import { getInvoice, invoiceCycleForDate, payInvoice, todayISO } from "@meusaldo/core";
import { db, schema } from "@meusaldo/db";
import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const yearMonth = z.string().regex(/^\d{4}-\d{2}$/);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

async function getOwnedCard(cardId: string, familyId: string) {
  const [card] = await db
    .select()
    .from(schema.creditCards)
    .where(and(eq(schema.creditCards.id, cardId), eq(schema.creditCards.familyId, familyId)));
  if (!card) throw new TRPCError({ code: "NOT_FOUND", message: "Cartão não encontrado" });
  return card;
}

export const cardsRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    db
      .select()
      .from(schema.creditCards)
      .where(
        and(
          eq(schema.creditCards.familyId, ctx.user.familyId),
          eq(schema.creditCards.archived, false),
        ),
      )
      .orderBy(asc(schema.creditCards.name)),
  ),

  invoice: protectedProcedure
    .input(z.object({ cardId: z.string().uuid(), cycle: yearMonth.optional() }))
    .query(async ({ ctx, input }) => {
      const card = await getOwnedCard(input.cardId, ctx.user.familyId);
      const cycle = input.cycle ?? invoiceCycleForDate(card.closingDay, todayISO());
      const invoice = await getInvoice(db, card, cycle);
      return { card, invoice, currentCycle: invoiceCycleForDate(card.closingDay, todayISO()) };
    }),

  payInvoice: protectedProcedure
    .input(
      z.object({
        cardId: z.string().uuid(),
        cycle: yearMonth,
        accountId: z.string().uuid(),
        date: isoDate.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const card = await getOwnedCard(input.cardId, ctx.user.familyId);
      const [account] = await db
        .select({ id: schema.bankAccounts.id })
        .from(schema.bankAccounts)
        .where(
          and(
            eq(schema.bankAccounts.id, input.accountId),
            eq(schema.bankAccounts.familyId, ctx.user.familyId),
          ),
        );
      if (!account) throw new TRPCError({ code: "NOT_FOUND", message: "Conta não encontrada" });

      const { amountCents } = await payInvoice(db, {
        card,
        cycle: input.cycle,
        accountId: input.accountId,
        date: input.date ?? todayISO(),
        userId: ctx.user.id,
      });
      return { amountCents };
    }),
});
