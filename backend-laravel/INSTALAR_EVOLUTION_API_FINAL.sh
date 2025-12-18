#!/bin/bash

# Script final para instalar Evolution API
# Tenta diferentes configurações até funcionar

set -e

echo "⚠️  Script obsoleto: a imagem atual da Evolution API está exigindo PostgreSQL."
echo "✅ Use:"
echo "   sudo bash /tmp/INSTALAR_EVOLUTION_API_COM_POSTGRES.sh"
echo ""
exit 0

CONTAINER_NAME="evolution-api-lacos"
API_PORT="8080"
API_KEY=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-f0-9' | fold -w 64 | head -n 1)

echo "💬 Instalando Evolution API (versão final)..."
echo ""

# Remover container antigo se existir
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "🗑️  Removendo container antigo..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
fi

echo "📦 Criando container SEM banco de dados (modo mais simples)..."
echo "   Tentando configuração mínima primeiro..."
echo ""

# Tentar sem banco de dados primeiro
docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  -p $API_PORT:8080 \
  -e AUTHENTICATION_API_KEY=$API_KEY \
  -e QRCODE_LIMIT=30 \
  -e QRCODE_COLOR=#198754 \
  atendai/evolution-api:latest

if [ $? -eq 0 ]; then
    echo "✅ Container criado!"
    echo ""
    echo "⏳ Aguardando inicialização (20 segundos)..."
    sleep 20
    
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
            echo "⚠️  API ainda não está respondendo (pode levar mais alguns segundos)"
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
        exit 0
    else
        echo "❌ Container não está rodando"
        echo ""
        echo "📋 Verificando logs..."
        docker logs $CONTAINER_NAME --tail 30
        echo ""
        
        # Tentar com MongoDB (provider mais comum)
        echo "🔄 Tentando com MongoDB como provider..."
        docker rm -f $CONTAINER_NAME 2>/dev/null || true
        
        docker run -d \
          --name $CONTAINER_NAME \
          --restart unless-stopped \
          -p $API_PORT:8080 \
          -e AUTHENTICATION_API_KEY=$API_KEY \
          -e DATABASE_ENABLED=true \
          -e DATABASE_PROVIDER=mongodb \
          -e DATABASE_CONNECTION_URI=mongodb://localhost:27017/evolution \
          -e QRCODE_LIMIT=30 \
          -e QRCODE_COLOR=#198754 \
          atendai/evolution-api:latest
        
        if [ $? -eq 0 ]; then
            echo "✅ Container criado com MongoDB!"
            sleep 20
            
            if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
                echo "✅ Container está rodando com MongoDB!"
                echo ""
                echo "📝 API Key: $API_KEY"
                echo "📋 Adicione ao .env:"
                echo "   WHATSAPP_API_URL=http://localhost:$API_PORT"
                echo "   WHATSAPP_API_KEY=$API_KEY"
                echo "   WHATSAPP_INSTANCE_NAME=lacos-2fa"
                exit 0
            else
                echo "❌ Ainda não funcionou com MongoDB"
                echo ""
                echo "📋 Últimos logs:"
                docker logs $CONTAINER_NAME --tail 30
                echo ""
                echo "💡 Tente verificar a documentação da Evolution API"
                echo "   ou use uma versão específica da imagem"
            fi
        fi
    fi
else
    echo "❌ Erro ao criar container"
    exit 1
fi

