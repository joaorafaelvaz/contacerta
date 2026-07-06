import { db, schema } from "@meusaldo/db";
import { and, asc, eq } from "drizzle-orm";
import { cache } from "react";

/** Contas ativas da família (para selects e listagens). */
export const getAccounts = cache(async (familyId: string) =>
  db
    .select()
    .from(schema.bankAccounts)
    .where(and(eq(schema.bankAccounts.familyId, familyId), eq(schema.bankAccounts.archived, false)))
    .orderBy(asc(schema.bankAccounts.name)),
);

/** Cartões ativos da família. */
export const getCards = cache(async (familyId: string) =>
  db
    .select()
    .from(schema.creditCards)
    .where(and(eq(schema.creditCards.familyId, familyId), eq(schema.creditCards.archived, false)))
    .orderBy(asc(schema.creditCards.name)),
);

/** Categorias da família ordenadas por tipo e nome. */
export const getCategories = cache(async (familyId: string) =>
  db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.familyId, familyId))
    .orderBy(asc(schema.categories.type), asc(schema.categories.name)),
);
