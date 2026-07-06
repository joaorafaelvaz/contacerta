import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

/** Usuário autenticado injetado pelo host (apps/web valida a sessão better-auth). */
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  familyId: string | null;
}

export interface TrpcContext {
  user: ApiUser | null;
}

const t = initTRPC.context<TrpcContext>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;

/** Exige usuário logado E com família — mesma regra do dashboard. */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user?.familyId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão inválida ou sem família" });
  }
  return next({
    ctx: { user: { ...ctx.user, familyId: ctx.user.familyId } },
  });
});
