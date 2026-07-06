import { auth } from "@/lib/auth";
import { appRouter } from "@meusaldo/api";
import type { TrpcContext } from "@meusaldo/api/trpc";
import { db, schema } from "@meusaldo/db";
import { TRPCError } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { eq } from "drizzle-orm";

async function createContext(req: Request): Promise<TrpcContext> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return { user: null };
  const [user] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      familyId: schema.users.familyId,
    })
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id));
  return { user: user ?? null };
}

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError({ error, path }: { error: TRPCError; path: string | undefined }) {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        console.error(`[trpc] ${path}:`, error);
      }
    },
  });

export { handler as GET, handler as POST };
