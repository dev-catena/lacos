#!/bin/bash

# Script simples para testar WhatsApp via curl
SERVER="192.168.0.20"
PORT="63022"
USER="darley"
PASSWORD="yhvh77"

echo "🧪 Testando envio de WhatsApp via Evolution API..."
echo ""

# Testar conexão primeiro
echo "1️⃣ Verificando se a instância está conectada..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" << 'REMOTE'
API_URL="http://localhost:8080"
API_KEY="34385147c5995b4098452a02ad86cd771b5d1dc5761198a48df5a9baecbc30f7"
INSTANCE_NAME="Lacos"

echo "Testando: $API_URL/instance/fetchInstances"
RESPONSE=$(curl -s -H "apikey: $API_KEY" "$API_URL/instance/fetchInstances")

if echo "$RESPONSE" | grep -q "$INSTANCE_NAME"; then
    echo "✅ Instância '$INSTANCE_NAME' encontrada!"
    STATUS=$(echo "$RESPONSE" | grep -o '"connectionStatus":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "   Status: $STATUS"
    
    if [ "$STATUS" = "open" ]; then
        echo ""
        echo "2️⃣ Testando envio de mensagem..."
        echo "   Telefone: 5531998856741"
        echo "   Instância: $INSTANCE_NAME"
        echo ""
        
        SEND_RESPONSE=$(curl -s -X POST \
            -H "apikey: $API_KEY" \
            -H "Content-Type: application/json" \
            "$API_URL/message/sendText/$INSTANCE_NAME" \
            -d '{
                "number": "5531998856741",
                "text": "🧪 Teste de envio - Laços\n\nEsta é uma mensagem de teste do sistema."
            }')
        
        echo "Resposta:"
        echo "$SEND_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$SEND_RESPONSE"
        
        if echo "$SEND_RESPONSE" | grep -q '"key"'; then
            echo ""
            echo "✅ Mensagem enviada com sucesso!"
        else
            echo ""
            echo "❌ Erro ao enviar mensagem"
        fi
    else
        echo "❌ Instância não está conectada (status: $STATUS)"
        echo "   Você precisa conectar o WhatsApp primeiro"
    fi
else
    echo "❌ Instância '$INSTANCE_NAME' não encontrada"
    echo "Resposta da API:"
    echo "$RESPONSE" | head -20
fi
REMOTE

echo ""
echo "✅ Teste concluído!"

