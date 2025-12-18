#!/bin/bash

# Script para verificar status da Evolution API

API_URL="${WHATSAPP_API_URL:-http://localhost:8080}"
API_KEY="${WHATSAPP_API_KEY}"

echo "🔍 Verificando Evolution API..."
echo ""

# 1. Verificar se container está rodando
echo "1️⃣ Verificando container Docker..."
if docker ps --format '{{.Names}}' | grep -q "evolution-api"; then
    echo "✅ Container Evolution API está rodando"
    docker ps | grep evolution-api
else
    echo "❌ Container Evolution API NÃO está rodando!"
    echo ""
    echo "Verificar todos os containers:"
    docker ps -a | grep evolution-api || echo "Nenhum container encontrado"
    echo ""
    echo "Para iniciar:"
    echo "   docker start evolution-api-lacos"
    exit 1
fi

echo ""

# 2. Verificar se API está respondendo
echo "2️⃣ Verificando se API está respondendo..."
if curl -s --max-time 5 "$API_URL" > /dev/null 2>&1; then
    echo "✅ API está respondendo em $API_URL"
else
    echo "❌ API NÃO está respondendo em $API_URL"
    echo ""
    echo "Verificar logs:"
    echo "   docker logs evolution-api-lacos"
    exit 1
fi

echo ""

# 3. Verificar instâncias (se API_KEY fornecida)
if [ -n "$API_KEY" ]; then
    echo "3️⃣ Verificando instâncias..."
    INSTANCES=$(curl -s --max-time 10 "$API_URL/instance/fetchInstances" \
      -H "apikey: $API_KEY" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo "✅ Instâncias:"
        echo "$INSTANCES" | jq . 2>/dev/null || echo "$INSTANCES"
    else
        echo "⚠️  Não foi possível listar instâncias"
        echo "   Verifique se API_KEY está correta"
    fi
else
    echo "3️⃣ Para verificar instâncias, defina API_KEY:"
    echo "   export WHATSAPP_API_KEY=sua_key"
fi

echo ""
echo "✅ Verificação concluída!"

