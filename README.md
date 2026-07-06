# MeuSaldo

Controle financeiro da família: entradas/saídas, múltiplas contas, cartões de crédito com
fatura e compras parceladas, contas a pagar com lembrete e orçamento por categoria.

**Fase 1** ✅: núcleo financeiro + dashboard web.
**Fase 2** ✅: bot WhatsApp via WAHA + resumo diário de lembretes.
**Fase 3**: app móvel iOS/Android (Expo/React Native).

Specs: [Fase 1](docs/superpowers/specs/2026-07-06-meusaldo-design.md) ·
[Fase 2](docs/superpowers/specs/2026-07-06-meusaldo-fase2-whatsapp-design.md)

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

## Bot WhatsApp (Fase 2)

1. Cada membro vincula seu número na página **Família** do dashboard — mensagens de
   números desconhecidos são ignoradas.
2. No **WAHA**, configure o webhook da sessão apontando para
   `https://SEU_APP/api/waha/webhook` com evento `message` e o header customizado
   `x-webhook-secret` igual ao `WAHA_WEBHOOK_SECRET` do `.env`.
3. Preencha no `.env`: `WAHA_URL`, `WAHA_API_KEY`, `WAHA_SESSION`,
   `OLLAMA_URL`/`OLLAMA_MODEL` (interpretação de linguagem natural).

Comandos: `saldo`, `fatura`, `contas`, `paguei <nome>`, `ajuda` — ou linguagem
natural: "mercado 250 nubank", "recebi 500 de freela na carteira",
"notebook 1200 em 3x no nubank". Sem Ollama disponível, os comandos fixos seguem
funcionando e o bot responde com a sintaxe de ajuda para o resto.

O resumo diário (contas atrasadas, vencendo hoje/amanhã e faturas a ≤3 dias) sai no
horário do `REMINDER_CRON` (padrão 8h, fuso `TZ`) e só é enviado quando há conteúdo.
`POST /api/waha/digest` (mesmo secret) dispara o resumo manualmente.

## Convenções de domínio

- **Conta a pagar = transação pendente com vencimento** — recorrências materializam
  transações pendentes (idempotente via índice único regra+competência).
- **Fatura é derivada**: lançamentos do cartão agrupados pelo ciclo de fechamento;
  compra no dia do fechamento pertence à fatura que fecha. Pagar a fatura cria uma
  saída na conta e marca os lançamentos do ciclo como pagos.
- **Parcelamento**: resto na primeira parcela; cada parcela cai em ciclos consecutivos.
- **Transferência**: par de transações ligadas por `transfer_group_id`.
