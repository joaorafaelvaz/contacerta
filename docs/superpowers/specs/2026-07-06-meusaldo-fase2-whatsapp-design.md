# MeuSaldo — Fase 2: Bot WhatsApp via WAHA (design aprovado, 2026-07-06)

Integração com o WAHA já instalado no VPS do usuário. O bot permite lançar
gastos/receitas, consultar saldo e fatura, listar/pagar contas pendentes e registrar
compras parceladas — além de um resumo diário de lembretes.

## Decisões

| Decisão | Escolha |
|---|---|
| Comandos | Lançamentos, saldo/fatura, contas a pagar + "paguei", compra parcelada |
| Interpretação | Híbrido: parser fixo p/ comandos simples + **Ollama** (structured output) p/ linguagem natural |
| Lembretes | Resumo diário de manhã (padrão 8h), só quando houver conteúdo |
| Vínculo | Campo telefone no perfil (página Família); números não vinculados são ignorados |

## Arquitetura

- **Webhook**: `POST /api/waha/webhook` (route handler no app Next.js). Valida
  `WAHA_WEBHOOK_SECRET` (header `x-webhook-secret` configurado no WAHA). Processa
  eventos `message`/`message.any`; mensagens `fromMe` só no chat consigo mesmo.
- **Envio**: `WahaChannel` (implementa `NotificationChannel` da Fase 1) via
  `POST {WAHA_URL}/api/sendText` com `X-Api-Key`.
- **Roteador**: comandos fixos (`saldo`, `fatura`, `contas`, `paguei <termo>`, `ajuda`)
  resolvidos por parser puro em `packages/core`; resto vai ao Ollama
  (`OLLAMA_URL`, `OLLAMA_MODEL`) com JSON schema forçado e prompt contendo contas,
  cartões e categorias da família. Em dúvida ou Ollama fora do ar → responde ajuda,
  nunca cria lançamento incerto.
- **Criação** reutiliza os serviços testados da Fase 1 (`createInstallmentPurchase`,
  regras de cartão→pendente etc.).
- **Resumo diário**: `node-cron` no `instrumentation.ts` (`REMINDER_CRON`, padrão
  `0 8 * * *`): materializa recorrências, monta por família as contas atrasadas /
  vencendo hoje e amanhã / faturas a ≤3 dias, envia aos membros vinculados.
  Agendado apenas quando `WAHA_URL` está configurada.

## Modelo de dados

- `users.phone` (text, único, nullable) — dígitos com DDI (ex: 5511999999999).
  Normalização assume Brasil (prefixa 55) para números de 10–11 dígitos.

## Testes

- Unitários em `packages/core`: normalização de telefone, parser de comandos fixos,
  formatação do resumo e das respostas.
- E2E local: POST simulando payloads do WAHA no webhook + mock HTTP do WAHA
  capturando `sendText` (sem depender do VPS).

## Env

`WAHA_URL`, `WAHA_API_KEY`, `WAHA_SESSION` (padrão `default`),
`WAHA_WEBHOOK_SECRET`, `OLLAMA_URL` (padrão `http://localhost:11434`),
`OLLAMA_MODEL` (padrão `llama3.2`), `REMINDER_CRON` (padrão `0 8 * * *`), `TZ`.
