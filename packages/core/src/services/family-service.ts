import { DEFAULT_CATEGORIES, type Db, schema } from "@meusaldo/db";
import { and, eq, gt } from "drizzle-orm";

/** Cria a família, vincula o usuário e semeia as categorias padrão. */
export async function createFamilyForUser(
  db: Db,
  input: { name: string; userId: string },
): Promise<{ familyId: string }> {
  return db.transaction(async (tx) => {
    const [family] = await tx
      .insert(schema.families)
      .values({ name: input.name })
      .returning({ id: schema.families.id });
    if (!family) throw new Error("Falha ao criar família");

    await tx
      .update(schema.users)
      .set({ familyId: family.id, updatedAt: new Date() })
      .where(eq(schema.users.id, input.userId));

    await tx
      .insert(schema.categories)
      .values(DEFAULT_CATEGORIES.map((c) => ({ ...c, familyId: family.id })));

    return { familyId: family.id };
  });
}

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

export async function createInvite(
  db: Db,
  input: { familyId: string; userId: string },
): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
  await db.insert(schema.familyInvites).values({
    familyId: input.familyId,
    token,
    createdBy: input.userId,
    expiresAt,
  });
  return { token, expiresAt };
}

/** Vincula o usuário à família do convite, se o token for válido. */
export async function acceptInvite(
  db: Db,
  input: { token: string; userId: string },
): Promise<{ familyId: string } | null> {
  const [invite] = await db
    .select()
    .from(schema.familyInvites)
    .where(
      and(eq(schema.familyInvites.token, input.token), gt(schema.familyInvites.expiresAt, new Date())),
    );
  if (!invite) return null;

  await db
    .update(schema.users)
    .set({ familyId: invite.familyId, updatedAt: new Date() })
    .where(eq(schema.users.id, input.userId));
  return { familyId: invite.familyId };
}
