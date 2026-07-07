# MeuSaldo

Controle financeiro da família: entradas/saídas, múltiplas contas, cartões de crédito com
fatura e compras parceladas, contas a pagar com lembrete e orçamento por categoria.

**Fase 1** ✅: núcleo financeiro + dashboard web.
**Fase 2** ✅: bot WhatsApp via WAHA + resumo diário de lembretes.
**Fase 3** ✅: app móvel iOS/Android (Expo/React Native) + API tRPC.

Specs: [Fase 1](docs/superpowers/specs/2026-07-06-meusaldo-design.md) ·
[Fase 2](docs/superpowers/specs/2026-07-06-meusaldo-fase2-whatsapp-design.md) ·
[Fase 3](docs/superpowers/specs/2026-07-06-meusaldo-fase3-mobile-design.md)

## Stack

- Monorepo pnpm: `apps/web` (Next.js 15 + Server Actions), `apps/mobile` (Expo/React
  Native), `packages/core` (regras de domínio puras + serviços), `packages/db`
  (Drizzle ORM + PostgreSQL), `packages/api` (routers tRPC compartilhados)
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

## Deploy no VPS (contacerta.linkwise.digital)

Tudo em [deploy/](deploy): stack do Portainer, env de produção, script CLI e conf
do nginx. O app sobe em `127.0.0.1:3078` (só o nginx nativo alcança) e as
migrations rodam automaticamente na subida do container.

**Via Portainer** — Stacks → Add stack → *Repository*:
`https://github.com/joaorafaelvaz/contacerta` (repo privado: configure credenciais
GitHub no Portainer), compose path `deploy/portainer-stack.yml`, e cole as
variáveis de [deploy/env.prod.example](deploy/env.prod.example) preenchidas.

**Via CLI** (alternativa):

```bash
git clone https://github.com/joaorafaelvaz/contacerta.git && cd contacerta
cp deploy/env.prod.example .env.prod && nano .env.prod   # segredos + WAHA/Ollama
./deploy/deploy.sh
```

**nginx nativo + TLS:**

```bash
sudo cp deploy/nginx-contacerta.conf /etc/nginx/sites-available/contacerta
sudo ln -s /etc/nginx/sites-available/contacerta /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d contacerta.linkwise.digital
```

**WAHA:** configure o webhook da sessão para
`https://contacerta.linkwise.digital/api/waha/webhook` com o header
`x-webhook-secret` = `WAHA_WEBHOOK_SECRET`. Do container, alcance WAHA/Ollama do
host via `http://host.docker.internal:<porta>`.

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

## App móvel (Fase 3)

Abas: **Início** (saldos, faturas, vencimentos com pagar, orçamento), **Lançamentos**
(mês + filtros, editar/excluir/pagar), **Novo** (lançamento rápido, com parcelamento
em cartão) e **Cartões** (fatura por ciclo + pagar). Login com a mesma conta do
dashboard (better-auth + SecureStore); a API é tRPC em `/api/trpc`, com tipos
compartilhados via `packages/api`.

**Testar no iPhone/Android (Expo Go):**

```bash
# descubra o IP local da máquina que roda o servidor (ipconfig) e:
cd apps/mobile
$env:EXPO_PUBLIC_API_URL='http://SEU_IP:3002'; npx expo start
# escaneie o QR com o app Expo Go (mesma rede Wi-Fi)
```

Para instalar de verdade: `eas build` (Android gera APK direto; iOS exige conta
Apple Developer + TestFlight).

## Convenções de domínio

- **Conta a pagar = transação pendente com vencimento** — recorrências materializam
  transações pendentes (idempotente via índice único regra+competência).
- **Fatura é derivada**: lançamentos do cartão agrupados pelo ciclo de fechamento;
  compra no dia do fechamento pertence à fatura que fecha. Pagar a fatura cria uma
  saída na conta e marca os lançamentos do ciclo como pagos.
- **Parcelamento**: resto na primeira parcela; cada parcela cai em ciclos consecutivos.
- **Transferência**: par de transações ligadas por `transfer_group_id`.
