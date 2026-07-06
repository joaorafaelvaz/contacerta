# MeuSaldo

Controle financeiro da família: entradas/saídas, múltiplas contas, cartões de crédito com
fatura e compras parceladas, contas a pagar com lembrete e orçamento por categoria.

**Fase 1** (esta versão): núcleo financeiro + dashboard web.
**Fase 2** (próxima): bot WhatsApp via WAHA + lembretes ativos.
**Fase 3**: app móvel iOS/Android (Expo/React Native).

Spec de design: [docs/superpowers/specs/2026-07-06-meusaldo-design.md](docs/superpowers/specs/2026-07-06-meusaldo-design.md)

## Stack

- Monorepo pnpm: `apps/web` (Next.js 15 + Server Actions), `packages/core` (regras de
  domínio puras + serviços), `packages/db` (Drizzle ORM + PostgreSQL)
- Auth: better-auth (e-mail/senha) com conceito de **família** (dados compartilhados)
- Dinheiro em centavos (integer); datas como strings ISO sem timezone

## Desenvolvimento

```bash
cp .env.example .env          # ajuste se necessário
docker compose up -d db       # Postgres local na porta 5434
pnpm install
pnpm db:migrate               # aplica migrations
pnpm dev                      # http://localhost:3002
pnpm test                     # testes de domínio (Vitest)
```

## Deploy no VPS

```bash
# no VPS, com .env preenchido (BETTER_AUTH_SECRET forte, BETTER_AUTH_URL público):
docker compose --profile prod up -d --build
```

O container do app aplica as migrations automaticamente na subida
(`RUN_MIGRATIONS=true`, ver `apps/web/src/instrumentation.ts`). O Postgres fica no
volume `pgdata` — faça backup com `pg_dump` periodicamente.

Portas configuráveis via `.env`: `APP_PORT` (padrão 3002 local) e `POSTGRES_PORT`
(padrão 5434), pensadas para conviver com outros serviços no mesmo VPS.

## Convenções de domínio

- **Conta a pagar = transação pendente com vencimento** — recorrências materializam
  transações pendentes (idempotente via índice único regra+competência).
- **Fatura é derivada**: lançamentos do cartão agrupados pelo ciclo de fechamento;
  compra no dia do fechamento pertence à fatura que fecha. Pagar a fatura cria uma
  saída na conta e marca os lançamentos do ciclo como pagos.
- **Parcelamento**: resto na primeira parcela; cada parcela cai em ciclos consecutivos.
- **Transferência**: par de transações ligadas por `transfer_group_id`.
