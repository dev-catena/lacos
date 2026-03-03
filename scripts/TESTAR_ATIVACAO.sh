#!/bin/bash

# Script para testar ativação de médico

set -e

cd /var/www/lacos-backend

EMAIL="coroneldarley@gmail.com"

echo "🔍 Verificando médico: $EMAIL"
echo ""

# Buscar token do médico
TOKEN=$(mysql -u root -pLacos2025Secure lacos -e "SELECT doctor_activation_token FROM users WHERE email='$EMAIL' LIMIT 1;" 2>/dev/null | tail -1 | tr -d ' ')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "NULL" ] || [ "$TOKEN" = "doctor_activation_token" ]; then
    echo "❌ Médico não encontrado ou já está ativado"
    exit 1
fi

echo "✅ Token encontrado: ${TOKEN:0:20}..."
echo ""

# Testar URL de ativação
ACTIVATION_URL="http://192.168.0.20/api/doctors/activate?token=$TOKEN"

echo "📡 Testando URL de ativação..."
echo "URL: $ACTIVATION_URL"
echo ""

# Fazer requisição
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$ACTIVATION_URL")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

echo "📊 Resposta:"
echo "HTTP Code: $HTTP_CODE"
echo "Body: $BODY"
echo ""

# Verificar status no banco após ativação
echo "🔍 Verificando status no banco após ativação..."
mysql -u root -pLacos2025Secure lacos -e "
SELECT 
    id,
    email,
    doctor_approved_at,
    CASE 
        WHEN doctor_activation_token IS NULL OR doctor_activation_token = '' THEN 'ATIVADO ✅'
        ELSE 'PENDENTE ❌'
    END as status,
    doctor_activation_token
FROM users 
WHERE email='$EMAIL';
" 2>/dev/null

echo ""
echo "=========================================="

