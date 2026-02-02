#!/bin/bash

##############################################
# Script para Obter Token de Teste
##############################################

SERVER="10.102.0.103"
USER="darley"
PASSWORD="yhvh77"
REMOTE_PATH="/var/www/lacos-backend"

echo "🔑 Obtendo Token de Teste"
echo "=========================="
echo ""

# Executar comando no servidor para pegar um token válido
echo "Buscando token de um usuário existente..."
echo ""

TOKEN=$(sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" << 'ENDSSH'
cd /var/www/lacos-backend
php artisan tinker --execute="
\$user = \App\Models\User::first();
if (\$user) {
    \$token = \$user->createToken('test-token')->plainTextToken;
    echo \$token;
} else {
    echo 'NO_USER';
}
"
ENDSSH
)

if [ "$TOKEN" == "NO_USER" ] || [ -z "$TOKEN" ]; then
    echo "❌ Nenhum usuário encontrado no banco de dados!"
    echo ""
    echo "Você precisa:"
    echo "1. Fazer login pelo app primeiro, ou"
    echo "2. Criar um usuário de teste"
    echo ""
    exit 1
fi

echo "✅ Token obtido com sucesso!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TOKEN:"
echo "$TOKEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Testar o token imediatamente
echo "🧪 Testando token..."
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" \
  "http://$SERVER/api/groups/1/media")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ Token válido! Endpoint retornou: $HTTP_CODE"
    echo "Resposta: $BODY"
elif [ "$HTTP_CODE" == "403" ]; then
    echo "⚠️ Token válido mas usuário não tem acesso ao grupo 1"
    echo "Isso é normal se o usuário não pertence ao grupo"
elif [ "$HTTP_CODE" == "401" ]; then
    echo "❌ Token inválido!"
else
    echo "⚠️ Status inesperado: $HTTP_CODE"
    echo "Resposta: $BODY"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Para testar manualmente:"
echo ""
echo "curl -H 'Authorization: Bearer $TOKEN' \\"
echo "     http://$SERVER/api/groups/1/media"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Salvar token em arquivo temporário
echo "$TOKEN" > /tmp/lacos_test_token.txt
echo "💾 Token salvo em: /tmp/lacos_test_token.txt"
echo ""

