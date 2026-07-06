# MeuSaldo — Fase 3: App móvel + API tRPC (design aprovado, 2026-07-06)

App iOS/Android em Expo/React Native consumindo uma API tRPC extraída do núcleo.
Prioridade de teste/instalação: **iOS** (dev via Expo Go; produção futura via
TestFlight/EAS com conta Apple Developer).

## Decisões

| Decisão | Escolha |
|---|---|
| Escopo MVP | Visão geral, lançamento rápido, lançamentos completos (filtros/editar/pagar), fatura do cartão com pagamento |
| Plataforma | iOS primeiro (mesmo código roda no Android) |
| API | tRPC v11 — tipos ponta a ponta no monorepo |
| Auth móvel | Plugin Expo do better-auth (SecureStore + cookie nas chamadas) |

## Arquitetura

- **Servidor** (`apps/web`): endpoint `/api/trpc/*` (fetch adapter). Contexto valida a
  sessão better-auth e exige `family_id` (protectedProcedure). Routers: `overview`,
  `accounts`, `cards` (fatura por ciclo + pagar), `categories`, `transactions`
  (listar/criar/editar/excluir/marcar pago + parcelamento). Tudo reutiliza os
  serviços testados de `packages/core`; inputs validados com zod. `AppRouter`
  exportado para o cliente.
- **Auth**: plugin `expo()` no servidor (trustedOrigins com scheme `meusaldo://`);
  no app, `@better-auth/expo/client` com `expo-secure-store`.
- **App** (`apps/mobile`): Expo + expo-router. Abas: Início (visão geral),
  Lançamentos (mês + filtros, editar/excluir/pagar), Novo (lançamento rápido com
  parcelamento quando cartão), Cartões (fatura por ciclo + pagar). React Query via
  tRPC. `EXPO_PUBLIC_API_URL` aponta para o servidor (IP local no dev).

## Verificação (limite do ambiente Windows)

- API tRPC: E2E real por HTTP (login better-auth → chamadas autenticadas).
- App: typecheck + `expo export` (valida o bundle). Teste visual no aparelho é do
  usuário via Expo Go (QR do `expo start`, mesma rede Wi-Fi).
