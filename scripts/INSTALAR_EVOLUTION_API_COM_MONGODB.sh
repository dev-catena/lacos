#!/bin/bash

# Script para instalar Evolution API com MongoDB
# MongoDB é mais simples que PostgreSQL para este caso

set -e

echo "⚠️  Script obsoleto: a imagem atual da Evolution API está rejeitando DATABASE_PROVIDER=mongodb."
echo "✅ Use PostgreSQL:"
echo "   sudo bash /tmp/INSTALAR_EVOLUTION_API_COM_POSTGRES.sh"
echo ""
exit 0

CONTAINER_NAME="evolution-api-lacos"
MONGODB_NAME="mongodb-evolution"
API_PORT="8080"
MONGODB_PORT="27017"
API_KEY=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-f0-9' | fold -w 64 | head -n 1)

echo "💬 Instalando Evolution API com MongoDB..."
echo ""

# Remover containers antigos se existirem
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "🗑️  Removendo container Evolution API antigo..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
fi

if docker ps -a --format '{{.Names}}' | grep -q "^${MONGODB_NAME}$"; then
    echo "🗑️  Removendo container MongoDB antigo..."
    docker stop $MONGODB_NAME 2>/dev/null || true
    docker rm $MONGODB_NAME 2>/dev/null || true
fi

# 1. Instalar MongoDB
echo "1️⃣ Instalando MongoDB..."
docker run -d \
  --name $MONGODB_NAME \
  --restart unless-stopped \
  -p $MONGODB_PORT:27017 \
  -e MONGO_INITDB_DATABASE=evolution \
  mongo:latest

if [ $? -eq 0 ]; then
    echo "✅ MongoDB criado!"
    echo "⏳ Aguardando MongoDB inicializar (10 segundos)..."
    sleep 10
else
    echo "❌ Erro ao criar MongoDB"
    exit 1
fi

# 2. Instalar Evolution API
echo ""
echo "2️⃣ Instalando Evolution API..."
docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  --link $MONGODB_NAME:mongodb \
  -p $API_PORT:8080 \
  -e AUTHENTICATION_API_KEY=$API_KEY \
  -e DATABASE_ENABLED=true \
  -e DATABASE_PROVIDER=mongodb \
  -e DATABASE_CONNECTION_URI=mongodb://mongodb:27017/evolution \
  -e QRCODE_LIMIT=30 \
  -e QRCODE_COLOR=#198754 \
  atendai/evolution-api:latest

if [ $? -eq 0 ]; then
    echo "✅ Evolution API criada!"
    echo ""
    echo "⏳ Aguardando inicialização (30 segundos)..."
    sleep 30
    
    # Verificar status
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "✅ Container Evolution API está rodando!"
        
        # Verificar MongoDB
        if docker ps --format '{{.Names}}' | grep -q "^${MONGODB_NAME}$"; then
            echo "✅ Container MongoDB está rodando!"
        fi
        
        echo ""
        echo "🔍 Verificando se API está respondendo..."
        sleep 5
        if curl -s --max-time 5 http://localhost:$API_PORT > /dev/null 2>&1; then
            echo "✅ API está respondendo!"
        else
            echo "⚠️  API ainda não está respondendo"
            echo "   Verifique: docker logs $CONTAINER_NAME"
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
        echo "   WHATSAPP_INSTANCE_NAME=lacos-2fa"
        echo ""
        echo "📊 Containers rodando:"
        docker ps | grep -E "($CONTAINER_NAME|$MONGODB_NAME)"
        echo ""
    else
        echo "❌ Container Evolution API não está rodando"
        echo ""
        echo "📋 Verificando logs..."
        docker logs $CONTAINER_NAME --tail 50
        echo ""
        echo "💡 Verifique se MongoDB está funcionando:"
        echo "   docker logs $MONGODB_NAME"
    fi
else
    echo "❌ Erro ao criar Evolution API"
    exit 1
fi

