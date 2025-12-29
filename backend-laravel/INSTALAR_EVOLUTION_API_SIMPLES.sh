#!/bin/bash

# Script simplificado para instalar Evolution API
# Usa configurações mínimas para evitar problemas

set -e

CONTAINER_NAME="evolution-api-lacos"
API_PORT="8080"
API_KEY=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-f0-9' | fold -w 64 | head -n 1)

echo "💬 Instalando Evolution API (versão simplificada)..."
echo ""

# Remover container antigo se existir
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "🗑️  Removendo container antigo..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
fi

# Verificar se porta está livre
if netstat -tuln 2>/dev/null | grep -q ":${API_PORT} " || ss -tuln 2>/dev/null | grep -q ":${API_PORT} "; then
    echo "⚠️  Porta $API_PORT está em uso!"
    echo "   Parando processo na porta..."
    # Tentar encontrar e parar processo
    PID=$(lsof -ti:$API_PORT 2>/dev/null || fuser $API_PORT/tcp 2>/dev/null | awk '{print $1}')
    if [ -n "$PID" ]; then
        kill -9 $PID 2>/dev/null || true
        sleep 2
    fi
fi

echo "📦 Criando container com configurações mínimas..."
docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  -p $API_PORT:8080 \
  -e AUTHENTICATION_API_KEY=$API_KEY \
  -e DATABASE_ENABLED=true \
  -e DATABASE_PROVIDER=jsonfile \
  atendai/evolution-api:latest

if [ $? -eq 0 ]; then
    echo "✅ Container criado!"
    echo ""
    echo "⏳ Aguardando inicialização (15 segundos)..."
    sleep 15
    
    # Verificar status
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "✅ Container está rodando!"
        echo ""
        echo "📝 API Key gerada: $API_KEY"
        echo ""
        echo "📋 Adicione ao .env:"
        echo "   WHATSAPP_API_URL=http://localhost:$API_PORT"
        echo "   WHATSAPP_API_KEY=$API_KEY"
        echo "   WHATSAPP_INSTANCE_NAME=lacos-2fa"
    else
        echo "❌ Container não está rodando"
        echo ""
        echo "📋 Verificando logs..."
        docker logs $CONTAINER_NAME --tail 50
        echo ""
        echo "💡 Possíveis soluções:"
        echo "   1. Verifique memória: free -h"
        echo "   2. Verifique espaço: df -h"
        echo "   3. Tente outra porta: edite API_PORT no script"
    fi
else
    echo "❌ Erro ao criar container"
    exit 1
fi

