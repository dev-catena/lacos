#!/bin/bash

##############################################
# Teste: PUT /api/users/{id} - formation_description
# Isola se o problema é frontend ou backend
##############################################

# Configuração - ajuste se necessário
BASE_URL="${BASE_URL:-http://127.0.0.1:8000/api}"
# Para backend remoto: BASE_URL="http://192.168.0.20:8000/api" ./test-formation-description.sh

echo "🧪 Teste: formation_description (Detalhes da Formação)"
echo "======================================================"
echo ""

# 1. Obter token - você precisa fazer login primeiro
if [ -z "$TOKEN" ]; then
    if [ -f /tmp/lacos_test_token.txt ]; then
        TOKEN=$(cat /tmp/lacos_test_token.txt)
        echo "📌 Usando token de /tmp/lacos_test_token.txt"
    else
        echo "❌ Token não encontrado!"
        echo ""
        echo "Opção 1 - Fazer login e obter token:"
        echo "  curl -s -X POST $BASE_URL/login \\"
        echo "    -H 'Content-Type: application/json' \\"
        echo "    -H 'Accept: application/json' \\"
        echo "    -d '{\"login\":\"SEU_EMAIL\",\"password\":\"SUA_SENHA\"}'"
        echo ""
        echo "Opção 2 - Usar variável:"
        echo "  TOKEN='seu_token_aqui' ./test-formation-description.sh"
        echo ""
        echo "Opção 3 - Gerar token localmente (backend rodando):"
        echo "  cd backend-laravel && php artisan tinker --execute=\"\\\$u = App\\\\Models\\\\User::first(); echo \\\$u->createToken('test')->plainTextToken;\""
        echo ""
        exit 1
    fi
fi

echo ""

# 2. Buscar usuário atual (GET /api/user)
echo "📥 1. Buscando usuário atual (GET /api/user)..."
USER_JSON=$(curl -s -H "Authorization: Bearer $TOKEN" -H "Accept: application/json" "$BASE_URL/user")

if echo "$USER_JSON" | grep -q '"id"'; then
    USER_ID=$(echo "$USER_JSON" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    CURRENT_DESC=$(echo "$USER_JSON" | grep -o '"formation_description":"[^"]*"' | cut -d'"' -f4)
    echo "   ✅ User ID: $USER_ID"
    echo "   📝 formation_description atual: ${CURRENT_DESC:-'(vazio)'}"
else
    echo "   ❌ Erro ao buscar usuário. Resposta:"
    echo "$USER_JSON" | head -5
    exit 1
fi

echo ""

# 3. Atualizar formation_description (PUT /api/users/{id})
TEST_VALUE="Teste curl $(date '+%Y-%m-%d %H:%M:%S') - Detalhes da formação alterados via API"
echo "📤 2. Enviando PUT /api/users/$USER_ID com formation_description..."
echo "   Valor: $TEST_VALUE"
echo ""

UPDATE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{\"formation_description\":\"$TEST_VALUE\"}" \
  "$BASE_URL/users/$USER_ID")

HTTP_CODE=$(echo "$UPDATE_RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
UPDATE_BODY=$(echo "$UPDATE_RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" == "200" ]; then
    echo "   ✅ PUT retornou 200 OK"
else
    echo "   ❌ PUT retornou $HTTP_CODE"
    echo "   Resposta: $UPDATE_BODY"
    exit 1
fi

echo ""

# 4. Verificar se foi salvo (GET /api/user novamente)
echo "📥 3. Verificando se foi salvo (GET /api/user)..."
USER_JSON_2=$(curl -s -H "Authorization: Bearer $TOKEN" -H "Accept: application/json" "$BASE_URL/user")

NEW_DESC=$(echo "$USER_JSON_2" | grep -o '"formation_description":"[^"]*"' | cut -d'"' -f4)
# Também tentar formationDescription (camelCase)
if [ -z "$NEW_DESC" ]; then
    NEW_DESC=$(echo "$USER_JSON_2" | grep -o '"formationDescription":"[^"]*"' | cut -d'"' -f4)
fi

echo ""

# 5. Resultado
echo "======================================================"
if [ -n "$NEW_DESC" ] && echo "$NEW_DESC" | grep -q "Teste curl"; then
    echo "✅ SUCESSO! Backend está funcionando corretamente."
    echo ""
    echo "   formation_description retornado: $NEW_DESC"
    echo ""
    echo "   👉 O problema está no FRONTEND (envio ou exibição dos dados)"
else
    echo "❌ FALHA! Backend não persistiu ou não retornou o campo."
    echo ""
    echo "   formation_description retornado: ${NEW_DESC:-'(vazio ou não encontrado)'}"
    echo ""
    echo "   👉 O problema está no BACKEND (salvamento ou resposta)"
fi
echo "======================================================"
echo ""
