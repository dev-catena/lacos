#!/bin/bash

# Instala Evolution API (atendai/evolution-api) com PostgreSQL via Docker.
# Corrige o erro "Database provider invalid" (v2 exige banco).
#
# Uso (no servidor):
#   sudo bash /tmp/INSTALAR_EVOLUTION_API_COM_POSTGRES.sh
#
# Depois:
#   export WHATSAPP_API_URL=http://localhost:8080
#   export WHATSAPP_API_KEY=... (impresso no final)
#   export WHATSAPP_INSTANCE_NAME=lacos-2fa
#   sudo -E bash /tmp/CRIAR_INSTANCIA_WHATSAPP.sh

set -e

CONTAINER_NAME="evolution-api-lacos"
POSTGRES_CONTAINER="postgres-evolution"
REDIS_CONTAINER="redis"
DOCKER_NETWORK="evolution-net"

API_PORT="${API_PORT:-8080}"
INSTANCE_NAME="${WHATSAPP_INSTANCE_NAME:-lacos-2fa}"
EVOLUTION_IMAGE="${EVOLUTION_IMAGE:-atendai/evolution-api:latest}"

API_KEY="${AUTHENTICATION_API_KEY:-}"
if [ -z "$API_KEY" ]; then
  API_KEY="$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-f0-9' | fold -w 64 | head -n 1)"
fi

POSTGRES_DB="${POSTGRES_DB:-evolution}"
POSTGRES_USER="${POSTGRES_USER:-evolution}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"
if [ -z "$POSTGRES_PASSWORD" ]; then
  POSTGRES_PASSWORD="$(openssl rand -hex 16 2>/dev/null || cat /dev/urandom | tr -dc 'a-f0-9' | fold -w 32 | head -n 1)"
fi

echo "💬 Instalando Evolution API com PostgreSQL..."
echo ""
echo "🧩 Imagem Evolution API: $EVOLUTION_IMAGE"
echo ""

if ! command -v docker >/dev/null 2>&1; then
  echo "❌ Docker não encontrado. Instale o Docker antes."
  exit 1
fi

echo "✅ Docker encontrado"
echo ""

echo "🔧 Preparando rede Docker: $DOCKER_NETWORK"
if ! docker network inspect "$DOCKER_NETWORK" >/dev/null 2>&1; then
  docker network create "$DOCKER_NETWORK" >/dev/null
  echo "✅ Rede criada"
else
  echo "✅ Rede já existe"
fi

echo ""
echo "🧹 Removendo containers antigos (se existirem)..."
docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
docker rm -f "$POSTGRES_CONTAINER" >/dev/null 2>&1 || true
docker rm -f "$REDIS_CONTAINER" >/dev/null 2>&1 || true
echo "✅ Ok"

echo ""
echo "1️⃣ Subindo PostgreSQL..."
docker run -d \
  --name "$POSTGRES_CONTAINER" \
  --network "$DOCKER_NETWORK" \
  --restart unless-stopped \
  -e POSTGRES_DB="$POSTGRES_DB" \
  -e POSTGRES_USER="$POSTGRES_USER" \
  -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  postgres:16-alpine >/dev/null

echo "⏳ Aguardando PostgreSQL ficar pronto..."
for i in $(seq 1 40); do
  if docker exec "$POSTGRES_CONTAINER" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    echo "✅ PostgreSQL pronto"
    break
  fi
  sleep 1
  if [ "$i" -eq 40 ]; then
    echo "❌ PostgreSQL não iniciou a tempo. Logs:"
    docker logs "$POSTGRES_CONTAINER" --tail 50 || true
    exit 1
  fi
done

echo ""
echo "2️⃣ Subindo Redis..."
docker run -d \
  --name "$REDIS_CONTAINER" \
  --network "$DOCKER_NETWORK" \
  --restart unless-stopped \
  redis:7-alpine >/dev/null

echo "⏳ Aguardando Redis ficar pronto..."
for i in $(seq 1 20); do
  if docker exec "$REDIS_CONTAINER" redis-cli ping >/dev/null 2>&1; then
    echo "✅ Redis pronto"
    break
  fi
  sleep 1
  if [ "$i" -eq 20 ]; then
    echo "❌ Redis não iniciou a tempo. Logs:"
    docker logs "$REDIS_CONTAINER" --tail 50 || true
    exit 1
  fi
done

echo ""
echo "3️⃣ Subindo Evolution API..."

run_evolution() {
  local provider="$1"
  local uri="$2"
  echo "   - Tentando DATABASE_PROVIDER=$provider"
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
  docker run -d \
    --name "$CONTAINER_NAME" \
    --network "$DOCKER_NETWORK" \
    --restart unless-stopped \
    -p "$API_PORT:8080" \
    -e NODE_OPTIONS="--dns-result-order=ipv4first" \
    -e AUTHENTICATION_API_KEY="$API_KEY" \
    -e DATABASE_ENABLED=true \
    -e DATABASE_PROVIDER="$provider" \
    -e DATABASE_CONNECTION_URI="$uri" \
    -e REDIS_ENABLED=true \
    -e REDIS_URI="redis://$REDIS_CONTAINER:6379" \
    -e REDIS_URL="redis://$REDIS_CONTAINER:6379" \
    -e REDIS_HOST="$REDIS_CONTAINER" \
    -e REDIS_PORT="6379" \
    -e REDIS_DB="0" \
    -e CACHE_REDIS_ENABLED="true" \
    -e CACHE_REDIS_URI="redis://$REDIS_CONTAINER:6379" \
    -e QRCODE_LIMIT=30 \
    -e QRCODE_COLOR="#198754" \
    "$EVOLUTION_IMAGE" >/dev/null
}

POSTGRES_URI="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_CONTAINER}:5432/${POSTGRES_DB}?schema=public"

# Tentativa 1 (mais comum)
run_evolution "postgresql" "$POSTGRES_URI"
sleep 6

if docker logs "$CONTAINER_NAME" --tail 30 2>&1 | grep -qi "Database provider"; then
  # Tentativa 2 (fallback)
  run_evolution "postgres" "$POSTGRES_URI"
  sleep 6
fi

echo "⏳ Aguardando Evolution API inicializar..."
sleep 10

echo "🔍 Aguardando API responder em http://localhost:${API_PORT}/ ..."
for i in $(seq 1 60); do
  if curl -s --max-time 2 "http://localhost:${API_PORT}/" >/dev/null 2>&1; then
    echo "✅ API respondeu"
    break
  fi
  sleep 2
  if [ "$i" -eq 60 ]; then
    echo "⚠️  API ainda não respondeu após ~120s."
  fi
done

if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "✅ Container Evolution API está rodando"
else
  echo "❌ Evolution API não ficou rodando. Logs:"
  docker logs "$CONTAINER_NAME" --tail 80 || true
  echo ""
  echo "📌 Dica: cole aqui a saída de:"
  echo "   docker logs $CONTAINER_NAME --tail 200"
  exit 1
fi

echo ""
echo "🔍 Testando resposta HTTP..."
if curl -s --max-time 5 "http://localhost:${API_PORT}/" >/dev/null 2>&1; then
  echo "✅ API respondeu em http://localhost:${API_PORT}/"
else
  echo "⚠️  API ainda não respondeu (pode levar mais alguns segundos)."
  echo "   Verifique logs: docker logs -f $CONTAINER_NAME"
fi

echo ""
echo "=========================================="
echo "✅ Instalação concluída!"
echo "=========================================="
echo ""
echo "📝 API Key: $API_KEY"
echo ""
echo "📋 Adicione ao .env do Laravel:"
echo "   WHATSAPP_API_URL=http://localhost:$API_PORT"
echo "   WHATSAPP_API_KEY=$API_KEY"
echo "   WHATSAPP_INSTANCE_NAME=$INSTANCE_NAME"
echo ""
echo "📱 Próximo passo (criar instância e obter QR):"
echo "   export WHATSAPP_API_URL=http://localhost:$API_PORT"
echo "   export WHATSAPP_API_KEY=$API_KEY"
echo "   export WHATSAPP_INSTANCE_NAME=$INSTANCE_NAME"
echo "   sudo -E bash /tmp/CRIAR_INSTANCIA_WHATSAPP.sh"
echo ""
echo "📊 Containers:"
docker ps | grep -E "($CONTAINER_NAME|$POSTGRES_CONTAINER|$REDIS_CONTAINER)" || true


