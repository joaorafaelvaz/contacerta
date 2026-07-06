import { getAccountsWithBalances } from "@meusaldo/core";
import { db, schema } from "@meusaldo/db";
import { asc, eq } from "drizzle-orm";
import { protectedProcedure, router } from "../trpc";

/** Dados de apoio para formulários do app: contas, categorias. */
export const metaRouter = router({
  accounts: protectedProcedure.query(({ ctx }) => getAccountsWithBalances(db, ctx.user.familyId)),

  categories: protectedProcedure.query(({ ctx }) =>
    db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.familyId, ctx.user.familyId))
      .orderBy(asc(schema.categories.type), asc(schema.categories.name)),
  ),
});
