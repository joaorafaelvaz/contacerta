import { cardsRouter } from "./routers/cards";
import { metaRouter } from "./routers/meta";
import { overviewRouter } from "./routers/overview";
import { transactionsRouter } from "./routers/transactions";
import { router } from "./trpc";

export const appRouter = router({
  overview: overviewRouter,
  transactions: transactionsRouter,
  cards: cardsRouter,
  meta: metaRouter,
});

export type AppRouter = typeof appRouter;
