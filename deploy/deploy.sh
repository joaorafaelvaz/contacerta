#!/usr/bin/env bash
# Deploy do ContaCerta no VPS (alternativa CLI ao Portainer).
# Uso: ./deploy/deploy.sh [arquivo-env]   (padrão: .env.prod na raiz do repo)
set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE="${1:-.env.prod}"
if [ ! -f "$ENV_FILE" ]; then
  echo "Arquivo $ENV_FILE não encontrado."
  echo "Crie a partir do template: cp deploy/env.prod.example .env.prod && nano .env.prod"
  exit 1
fi

# aborta se segredos obrigatórios estiverem vazios
for var in BETTER_AUTH_SECRET POSTGRES_PASSWORD; do
  if ! grep -Eq "^${var}=.+" "$ENV_FILE"; then
    echo "Preencha ${var} em ${ENV_FILE} antes do deploy."
    exit 1
  fi
done

echo "==> Atualizando código (git pull)..."
git pull --ff-only

echo "==> Build e subida da stack..."
docker compose -f deploy/portainer-stack.yml --env-file "$ENV_FILE" -p contacerta up -d --build

echo "==> Limpando imagens antigas..."
docker image prune -f >/dev/null

echo "==> Estado da stack:"
docker compose -f deploy/portainer-stack.yml --env-file "$ENV_FILE" -p contacerta ps

echo
echo "OK. Teste local no VPS:  curl -s http://127.0.0.1:\${APP_PORT:-3078} | head -c 200"
echo "Público (após nginx+TLS): https://contacerta.linkwise.digital"
