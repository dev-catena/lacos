#!/bin/bash

# Script para verificar e corrigir ativação de médico

set -e

cd /var/www/lacos-backend

EMAIL="coroneldarley@gmail.com"

echo "🔍 Verificando status do médico: $EMAIL"
echo ""

# Verificar status atual
echo "📊 Status atual no banco:"
mysql -u root -pLacos2025Secure lacos -e "
SELECT 
    id,
    email,
    doctor_approved_at,
    CASE 
        WHEN doctor_activation_token IS NULL OR doctor_activation_token = '' THEN 'ATIVADO'
        ELSE 'PENDENTE ATIVAÇÃO'
    END as status_ativacao,
    doctor_activation_token,
    doctor_activation_token_expires_at
FROM users 
WHERE email='$EMAIL' 
LIMIT 1;
" 2>/dev/null

echo ""
echo "=========================================="
echo ""

# Perguntar se deseja ativar manualmente
read -p "Deseja ativar manualmente este médico? (s/N): " resposta

if [[ "$resposta" =~ ^[Ss]$ ]]; then
    echo ""
    echo "🔧 Ativando médico manualmente..."
    
    mysql -u root -pLacos2025Secure lacos -e "
    UPDATE users 
    SET 
        doctor_activation_token = NULL,
        doctor_activation_token_expires_at = NULL,
        updated_at = NOW()
    WHERE email='$EMAIL';
    " 2>/dev/null
    
    echo "✅ Médico ativado!"
    echo ""
    echo "📊 Novo status:"
    mysql -u root -pLacos2025Secure lacos -e "
    SELECT 
        id,
        email,
        doctor_approved_at,
        CASE 
            WHEN doctor_activation_token IS NULL OR doctor_activation_token = '' THEN 'ATIVADO'
            ELSE 'PENDENTE ATIVAÇÃO'
        END as status_ativacao,
        doctor_activation_token
    FROM users 
    WHERE email='$EMAIL' 
    LIMIT 1;
    " 2>/dev/null
else
    echo "❌ Operação cancelada"
fi

echo ""
echo "=========================================="

