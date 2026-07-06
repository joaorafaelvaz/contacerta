import {
  addDaysISO,
  getAccountsWithBalances,
  getBudgetUsage,
  getInvoice,
  invoiceCycleForDate,
  materializeUpcoming,
  monthOfISO,
  todayISO,
} from "@meusaldo/core";
import { db, schema } from "@meusaldo/db";
import { and, asc, eq, isNotNull, lte } from "drizzle-orm";
import { protectedProcedure, router } from "../trpc";

export const overviewRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const familyId = ctx.user.familyId;
    const today = todayISO();
    const month = monthOfISO(today);

    await materializeUpcoming(db, familyId, month);

    const cards = await db.query.creditCards.findMany({
      where: and(eq(schema.creditCards.familyId, familyId), eq(schema.creditCards.archived, false)),
    });

    const [accounts, invoices, budgets, upcoming] = await Promise.all([
      getAccountsWithBalances(db, familyId),
      Promise.all(
        cards.map(async (card) => {
          const invoice = await getInvoice(db, card, invoiceCycleForDate(card.closingDay, today));
          return {
            cardId: card.id,
            cardName: card.name,
            totalCents: invoice.totalCents,
            dueDate: invoice.dueDate,
            cycle: invoice.cycle,
          };
        }),
      ),
      getBudgetUsage(db, familyId, month),
      db
        .select()
        .from(schema.transactions)
        .where(
          and(
            eq(schema.transactions.familyId, familyId),
            eq(schema.transactions.status, "pending"),
            isNotNull(schema.transactions.dueDate),
            lte(schema.transactions.dueDate, addDaysISO(today, 30)),
          ),
        )
        .orderBy(asc(schema.transactions.dueDate))
        .limit(12),
    ]);

    return { today, month, accounts, invoices, budgets, upcoming };
  }),
});
