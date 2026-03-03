#!/bin/bash

##############################################
# Teste completo: formation_description
# 1. Faz login para obter token
# 2. Testa PUT /api/users/{id}
# 3. Verifica se persistiu
##############################################

BASE_URL="${BASE_URL:-http://127.0.0.1:8000/api}"

# Credenciais - altere para um usuário cuidador profissional de teste
LOGIN="${LOGIN:-beto@gmail.com}"
PASSWORD="${PASSWORD:-123456}"

echo "🧪 Teste: formation_description (Detalhes da Formação)"
echo "======================================================"
echo "Base URL: $BASE_URL"
echo "Login: $LOGIN"
echo ""

# 1. Login
echo "📥 1. Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{\"login\":\"$LOGIN\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "   ❌ Login falhou. Verifique credenciais."
    echo "   Resposta: $LOGIN_RESPONSE" | head -3
    echo ""
    echo "   Use: LOGIN=email@exemplo.com PASSWORD=senha ./test-formation-description-completo.sh"
    exit 1
fi

echo "   ✅ Token obtido"
echo ""

# 2. Buscar user ID
echo "📥 2. Buscando usuário (GET /api/user)..."
USER_JSON=$(curl -s -H "Authorization: Bearer $TOKEN" -H "Accept: application/json" "$BASE_URL/user")
USER_ID=$(echo "$USER_JSON" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$USER_ID" ]; then
    echo "   ❌ Não foi possível obter user ID"
    exit 1
fi

CURRENT_DESC=$(echo "$USER_JSON" | grep -o '"formation_description":"[^"]*"' | cut -d'"' -f4)
echo "   User ID: $USER_ID"
echo "   formation_description atual: ${CURRENT_DESC:-(vazio)}"
echo ""

# 3. Atualizar
TEST_VALUE="Teste curl $(date '+%Y-%m-%d %H:%M:%S')"
echo "📤 3. Enviando PUT /api/users/$USER_ID..."
echo "   formation_description: $TEST_VALUE"

PUT_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{\"formation_description\":\"$TEST_VALUE\",\"city\":\"Belo Horizonte\",\"neighborhood\":\"Centro\"}" \
  "$BASE_URL/users/$USER_ID")

HTTP_BODY=$(echo "$PUT_RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$PUT_RESPONSE" | tail -n 1)

if [ "$HTTP_CODE" != "200" ]; then
    echo "   ❌ PUT retornou $HTTP_CODE"
    echo "$HTTP_BODY"
    exit 1
fi

echo "   ✅ PUT 200 OK"
echo ""

# 4. Verificar
echo "📥 4. Verificando persistência (GET /api/user)..."
USER_JSON_2=$(curl -s -H "Authorization: Bearer $TOKEN" -H "Accept: application/json" "$BASE_URL/user")
NEW_DESC=$(echo "$USER_JSON_2" | grep -o '"formation_description":"[^"]*"' | cut -d'"' -f4)

echo ""

# Resultado
echo "======================================================"
if [ -n "$NEW_DESC" ] && echo "$NEW_DESC" | grep -q "Teste curl"; then
    echo "✅ BACKEND OK! formation_description foi salvo e retornado."
    echo ""
    echo "   Valor no banco: $NEW_DESC"
    echo ""
    echo "   👉 Se o app não mostra: problema no FRONTEND"
else
    echo "❌ BACKEND com problema!"
    echo ""
    echo "   Retornado: ${NEW_DESC:-(vazio)}"
    echo ""
    echo "   👉 Problema no BACKEND (salvar ou retornar)"
fi
echo "======================================================"
