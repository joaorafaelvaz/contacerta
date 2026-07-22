#!/usr/bin/env bash
# Bateria de validação do bot WhatsApp — roda no VPS.
#
#   ./deploy/validar-bot.sh                 # usa o telefone já vinculado no banco
#   ./deploy/validar-bot.sh 554899073477    # ou informe o número explicitamente
#
# Simula mensagens no webhook e lê a resposta do bot nos logs do container,
# comparando com o esperado. Cria lançamentos de teste (valores 12,34 / 56,78
# / 98,76) — o comando de limpeza é impresso no final.
set -uo pipefail
cd "$(dirname "$0")/.."

ENV_FILE="${ENV_FILE:-.env.prod}"
APP="${APP_CONTAINER:-contacerta-app-1}"
DB="${DB_CONTAINER:-contacerta-db-1}"
URL="${APP_URL:-http://127.0.0.1:3078}"
PGUSER_="${POSTGRES_USER:-contacerta}"
PGDB_="${POSTGRES_DB:-contacerta}"

SECRET=""
[ -f "$ENV_FILE" ] && SECRET=$(grep -E '^WAHA_WEBHOOK_SECRET=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'")

PHONE="${1:-}"
if [ -z "$PHONE" ]; then
  PHONE=$(docker exec "$DB" psql -U "$PGUSER_" -d "$PGDB_" -tAc \
    "SELECT phone FROM users WHERE phone IS NOT NULL LIMIT 1" 2>/dev/null | tr -d '[:space:]')
fi
if [ -z "$PHONE" ]; then
  echo "Nenhum telefone vinculado. Vincule pela tela Família ou passe como argumento."
  exit 1
fi

echo "Validando bot — app=$APP  telefone=$PHONE  secret=$([ -n "$SECRET" ] && echo definido || echo VAZIO)"
echo

total=0
ok=0

# enviar <titulo> <mensagem> <trecho esperado na resposta>
enviar() {
  local titulo="$1" msg="$2" esperado="$3"
  total=$((total + 1))
  local antes resp
  antes=$(docker logs "$APP" 2>&1 | wc -l)

  curl -s -X POST "$URL/api/waha/webhook" \
    -H "Content-Type: application/json" \
    ${SECRET:+-H "x-webhook-secret: $SECRET"} \
    -d "{\"event\":\"message\",\"payload\":{\"from\":\"${PHONE}@c.us\",\"to\":\"x\",\"fromMe\":false,\"body\":\"${msg}\"}}" \
    > /dev/null

  resp=$(docker logs "$APP" 2>&1 | tail -n +$((antes + 1)) \
    | grep -F '[bot] resposta:' | tail -1 | sed 's/.*\[bot\] resposta: //')

  echo "▶ $titulo"
  echo "  enviei:   \"$msg\""
  if [ -z "$resp" ]; then
    local motivo
    motivo=$(docker logs "$APP" 2>&1 | tail -n +$((antes + 1)) | grep -F '[bot]' | tail -2)
    echo "  ✗ sem resposta do bot"
    [ -n "$motivo" ] && echo "    logs: $motivo"
  else
    echo "  resposta: $resp"
    if echo "$resp" | grep -qF "$esperado"; then
      echo "  ✓ ok (contém \"$esperado\")"
      ok=$((ok + 1))
    else
      echo "  ✗ esperava conter \"$esperado\""
    fi
  fi
  echo
}

# --- comandos fixos (não usam o Ollama) ---------------------------------
enviar "Saldo"           "saldo"   "Saldo das contas"
enviar "Fatura"          "fatura"  "Fatura atual dos cartões"
enviar "Contas a pagar"  "contas"  "onta"        # "Contas a pagar" ou "Nenhuma conta..."
enviar "Ajuda"           "ajuda"   "MeuSaldo"

# --- linguagem natural (passa pelo Ollama) ------------------------------
enviar "Despesa em conta"    "mercado 12,34 no nubank"                 "Despesa lançada"
enviar "Receita"             "recebi 56,78 de freela no nubank"        "Receita lançada"
enviar "Compra parcelada"    "fone 98,76 em 3x no cartao nubank"       "Compra parcelada registrada"
enviar "Mensagem qualquer"   "bom dia, tudo bem"                       "Não entendi"

echo "──────────────────────────────────────────"
echo "Resultado: $ok/$total cenários OK"
echo
echo "Lançamentos de teste criados (12,34 / 56,78 / 98,76). Confira antes de apagar:"
echo "  docker exec $DB psql -U $PGUSER_ -d $PGDB_ -c \\"
echo "    \"SELECT description, amount_cents, date FROM transactions WHERE amount_cents IN (1234, 5678, 3292, 3291);\""
echo
echo "Para remover (a exclusão da compra parcelada já remove as parcelas em cascata):"
echo "  docker exec $DB psql -U $PGUSER_ -d $PGDB_ -c \\"
echo "    \"DELETE FROM installment_purchases WHERE total_amount_cents = 9876;"
echo "     DELETE FROM transactions WHERE amount_cents IN (1234, 5678);\""
