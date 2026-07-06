import type { AppRouter } from "@meusaldo/api";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import { authClient } from "./auth-client";
import { API_URL } from "./config";

export const trpc = createTRPCReact<AppRouter>();

export function createTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${API_URL}/api/trpc`,
        transformer: superjson,
        // o plugin Expo do better-auth guarda o cookie de sessão no SecureStore
        headers: () => ({ cookie: authClient.getCookie() }),
      }),
    ],
  });
}
