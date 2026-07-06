import { db, schema } from "@meusaldo/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  familyId: string | null;
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const [user] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      familyId: schema.users.familyId,
    })
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id));
  return user ?? null;
});

/** Exige usuário logado; redireciona para /login caso contrário. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Exige usuário com família; sem família vai para o onboarding. */
export async function requireFamily(): Promise<CurrentUser & { familyId: string }> {
  const user = await requireUser();
  if (!user.familyId) redirect("/onboarding");
  return user as CurrentUser & { familyId: string };
}
