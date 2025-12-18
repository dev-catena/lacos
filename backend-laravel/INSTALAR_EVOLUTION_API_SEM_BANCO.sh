#!/bin/bash

# Script para instalar Evolution API SEM banco de dados
# Para uso simples de 2FA, não precisa de banco

set -e

CONTAINER_NAME="evolution-api-lacos"
API_PORT="8080"
API_KEY=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-f0-9' | fold -w 64 | head -n 1)

echo "💬 Instalando Evolution API (sem banco de dados)..."
echo ""

# Remover container antigo se existir
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "🗑️  Removendo container antigo..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
fi

echo "📦 Criando container SEM banco de dados..."
docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  -p $API_PORT:8080 \
  -e AUTHENTICATION_API_KEY=$API_KEY \
  -e DATABASE_ENABLED=false \
  -e QRCODE_LIMIT=30 \
  -e QRCODE_COLOR=#198754 \
  atendai/evolution-api:latest

if [ $? -eq 0 ]; then
    echo "✅ Container criado!"
    echo ""
    echo "⏳ Aguardando inicialização (25 segundos)..."
    sleep 25
    
    # Verificar status
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "✅ Container está rodando!"
        echo ""
        
        # Verificar se API responde
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
    else
        echo "❌ Container não está rodando"
        echo ""
        echo "📋 Verificando logs..."
        docker logs $CONTAINER_NAME --tail 50
        echo ""
        echo "💡 Se ainda houver erro, pode ser necessário usar banco de dados"
        echo "   Tente: sudo bash INSTALAR_EVOLUTION_API_COM_POSTGRES.sh"
    fi
else
    echo "❌ Erro ao criar container"
    exit 1
fi

