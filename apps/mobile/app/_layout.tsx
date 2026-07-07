import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { createTrpcClient, trpc } from "../lib/trpc";
import { useTheme } from "../lib/ui";

export default function RootLayout() {
  const { colors } = useTheme();
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => createTrpcClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerTintColor: colors.primaryDark,
            headerStyle: { backgroundColor: colors.card },
            headerTitleStyle: { color: colors.text },
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="lancamento/[id]" options={{ title: "Editar lançamento" }} />
          <Stack.Screen name="cartao/[id]" options={{ title: "Fatura" }} />
        </Stack>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
