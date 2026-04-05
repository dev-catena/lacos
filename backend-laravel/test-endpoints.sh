#!/bin/bash

##############################################
# Script de Teste dos Endpoints
##############################################

SERVER="192.168.0.20"
API_URL="http://$SERVER/api"

echo "🧪 Teste dos Endpoints - Mídias e Alertas"
echo "=========================================="
echo ""

# Solicitar token ao usuário
echo "Para testar, você precisa de um token de autenticação."
echo ""
echo "Como obter o token:"
echo "1. Faça login no app ou pela API: POST /api/login"
echo "2. Copie o token Bearer retornado"
echo ""
read -p "Cole seu token Bearer aqui: " TOKEN

if [ -z "$TOKEN" ]; then
    echo "❌ Token não fornecido!"
    exit 1
fi

echo ""
echo "🔑 Token recebido: ${TOKEN:0:20}..."
echo ""

# Testar endpoints
echo "📋 Testando Endpoints..."
echo ""

# 1. Listar mídias do grupo 1
echo "1️⃣ GET /api/groups/1/media"
echo "---"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" \
  "$API_URL/groups/1/media")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "Status: $HTTP_CODE"
echo "Resposta: $BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ Endpoint de mídias funcionando!"
else
    echo "❌ Erro no endpoint de mídias"
fi
echo ""

# 2. Listar alertas ativos do grupo 1
echo "2️⃣ GET /api/groups/1/alerts/active"
echo "---"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" \
  "$API_URL/groups/1/alerts/active")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "Status: $HTTP_CODE"
echo "Resposta: $BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ Endpoint de alertas funcionando!"
else
    echo "❌ Erro no endpoint de alertas"
fi
echo ""

# Resumo
echo "=========================================="
echo "📊 Resumo dos Testes"
echo "=========================================="
echo ""
echo "Endpoints testados:"
echo "  • GET /api/groups/{id}/media"
echo "  • GET /api/groups/{id}/alerts/active"
echo ""
echo "✅ Se ambos retornaram status 200, o backend está funcionando!"
echo ""
echo "Próximo passo: Teste fazer upload pelo app React Native"
echo ""

