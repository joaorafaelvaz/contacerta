# MeuSaldo — Design aprovado (2026-07-06)

Controle financeiro **familiar** (dados compartilhados): entradas/saídas, múltiplas contas,
cartões de crédito com fatura e compras parceladas, contas a pagar com lembrete e orçamento
por categoria. Uso pessoal, com arquitetura que não impeça virar produto.

## Fases

1. **Núcleo financeiro + dashboard web** (esta spec) — CRUD completo, lembretes como painel
   de "próximos vencimentos".
2. **Bot WhatsApp** via WAHA já instalado no VPS do usuário (webhook para receber, REST para
   enviar) + agendador de lembretes ativos.
3. **App móvel** iOS/Android com Expo/React Native, consumindo API extraída do mesmo núcleo.

Cada fase tem spec e plano próprios.

## Decisões de brainstorming

| Decisão | Escolha |
|---|---|
| Propósito | Pessoal, mas pode virar produto |
| WhatsApp | Não-oficial via WAHA (já rodando no VPS); camada de canal abstraída para permitir migração à API oficial |
| Gastos de cartão | Lançamento manual agora; modelo preparado para Open Finance (Pluggy) depois via `external_id` |
| Ordem | Backend + web → WhatsApp → móvel |
| Stack | TypeScript full-stack: Next.js monolito, PostgreSQL, Drizzle, better-auth |
| Usuários | Família com dados compartilhados (membro convida membro) |
| Lembretes F1 | Só painel no dashboard |
| Hospedagem | VPS próprio com Docker Compose, convivendo com outros serviços |

## Arquitetura (Fase 1)

Monorepo pnpm: `apps/web` (Next.js App Router, Server Actions), `packages/core` (regras de
domínio puras e serviços), `packages/db` (Drizzle + migrations). Sem camada de API HTTP na
Fase 1 (YAGNI) — nasce na Fase 3. Webhook WAHA da Fase 2 será route handler no próprio app.

Dinheiro sempre em **centavos (integer)**. Datas de lançamento como `date` (string ISO), sem
timezone. PT-BR/BRL. UI responsiva.

## Modelo de dados

- `families`, `users` (better-auth + family_id), `family_invites` (token de convite)
- `bank_accounts` — saldo corrente derivado das transações
- `credit_cards` — limite, dia de fechamento, dia de vencimento, conta de pagamento padrão
- `categories` (receita|despesa) e `budgets` (categoria + mês + meta)
- `transactions` — entidade central; conta **ou** cartão (check constraint), status
  paga|pendente, due_date. *Conta a pagar = transação pendente com vencimento.*
  Transferência = par de transações ligadas por `transfer_group_id`.
- `installment_purchases` — compra parcelada gera N transações filhas, cada uma na fatura correta
- `recurring_rules` — geram transações pendentes por mês, idempotente via unique
  (rule, competência)

## Regras de domínio (testes primeiro)

1. **Ciclo de fatura** derivado do dia de fechamento; casos-borda dias 29–31 e compra no dia
   do fechamento (pertence à fatura que fecha).
2. **Parcelamento** com resto na primeira parcela; datas das parcelas caem em ciclos consecutivos.
3. **Pagar fatura** cria saída paga na conta escolhida e marca lançamentos do ciclo como pagos.
4. **Recorrência** materializada on-demand (carregamento do dashboard), sem duplicar.
5. **Orçamento**: consumo = despesas pagas+pendentes da categoria no mês vs. meta.
6. `NotificationChannel` (interface em core) isola o canal WhatsApp — implementação na Fase 2.
