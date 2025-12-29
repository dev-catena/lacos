#!/bin/bash

# Script para corrigir e iniciar Evolution API

set -e

CONTAINER_NAME="evolution-api-lacos"
API_PORT="8080"

echo "🔧 Corrigindo Evolution API..."
echo ""

# Verificar status do container
echo "1️⃣ Verificando status do container..."
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    STATUS=$(docker ps -a --format '{{.Status}}' --filter "name=${CONTAINER_NAME}")
    echo "   Status: $STATUS"
    
    if echo "$STATUS" | grep -q "Exited"; then
        echo "⚠️  Container está parado"
        echo ""
        
        # Ver logs para entender o problema
        echo "2️⃣ Verificando logs (últimas 30 linhas)..."
        echo "----------------------------------------"
        docker logs --tail 30 $CONTAINER_NAME
        echo "----------------------------------------"
        echo ""
        
        # Tentar iniciar
        echo "3️⃣ Tentando iniciar container..."
        docker start $CONTAINER_NAME
        
        sleep 5
        
        # Verificar se iniciou
        if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            echo "✅ Container iniciado com sucesso!"
        else
            echo "❌ Container não iniciou. Verificando problema..."
            echo ""
            
            # Ver logs de erro
            echo "📋 Últimos logs de erro:"
            docker logs --tail 50 $CONTAINER_NAME | grep -i error || docker logs --tail 50 $CONTAINER_NAME
            echo ""
            
            # Tentar recriar container
            echo "🔄 Tentando recriar container..."
            read -p "Deseja remover e recriar o container? (s/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Ss]$ ]]; then
                echo "🗑️  Removendo container antigo..."
                docker stop $CONTAINER_NAME 2>/dev/null || true
                docker rm $CONTAINER_NAME 2>/dev/null || true
                
                echo "📦 Recriando container..."
                API_KEY=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-f0-9' | fold -w 64 | head -n 1)
                INSTANCE_NAME="lacos-2fa"
                
                docker run -d \
                  --name $CONTAINER_NAME \
                  -p $API_PORT:8080 \
                  -e AUTHENTICATION_API_KEY=$API_KEY \
                  -e DATABASE_ENCRYPTED=true \
                  -e QRCODE_LIMIT=30 \
                  -e QRCODE_COLOR=#198754 \
                  atendai/evolution-api:latest
                
                if [ $? -eq 0 ]; then
                    echo "✅ Container recriado!"
                    echo ""
                    echo "⏳ Aguardando inicialização (10 segundos)..."
                    sleep 10
                    
                    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
                        echo "✅ Container está rodando!"
                        echo ""
                        echo "📝 Nova API Key: $API_KEY"
                        echo "   Adicione ao .env: WHATSAPP_API_KEY=$API_KEY"
                    else
                        echo "❌ Container ainda não está rodando"
                        echo "   Verifique logs: docker logs $CONTAINER_NAME"
                    fi
                else
                    echo "❌ Erro ao recriar container"
                fi
            fi
        fi
    else
        echo "✅ Container está rodando!"
    fi
else
    echo "❌ Container não existe!"
    echo "   Execute: sudo bash CONTINUAR_APOS_DOCKER.sh"
    exit 1
fi

echo ""

# Verificar se API está respondendo
echo "4️⃣ Verificando se API está respondendo..."
sleep 2
if curl -s --max-time 5 http://localhost:$API_PORT > /dev/null 2>&1; then
    echo "✅ API está respondendo!"
else
    echo "⚠️  API ainda não está respondendo"
    echo "   Aguarde alguns segundos e tente novamente"
    echo "   Ou verifique logs: docker logs -f $CONTAINER_NAME"
fi

echo ""
echo "📊 Status final:"
docker ps | grep $CONTAINER_NAME || docker ps -a | grep $CONTAINER_NAME


