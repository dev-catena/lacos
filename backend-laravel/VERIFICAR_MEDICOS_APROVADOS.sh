#!/bin/bash

# Script para verificar médicos aprovados

set -e

cd /var/www/lacos-backend

echo "🔍 Verificando médicos aprovados..."
echo ""

mysql -u root -pLacos2025Secure lacos -e "
SELECT 
    id,
    email,
    name,
    doctor_approved_at,
    CASE 
        WHEN doctor_activation_token IS NULL OR doctor_activation_token = '' THEN 'ATIVADO'
        ELSE 'PENDENTE ATIVAÇÃO'
    END as status_ativacao,
    is_blocked,
    CASE 
        WHEN doctor_approved_at IS NOT NULL AND is_blocked = 0 THEN 'DEVE APARECER EM APROVADOS'
        WHEN doctor_approved_at IS NULL THEN 'PENDENTE'
        WHEN is_blocked = 1 THEN 'BLOQUEADO'
        ELSE 'OUTRO'
    END as status_visualizacao
FROM users 
WHERE profile='doctor' 
ORDER BY doctor_approved_at DESC, created_at DESC;
" 2>/dev/null

echo ""
echo "=========================================="
echo "📊 Resumo:"
echo ""

mysql -u root -pLacos2025Secure lacos -e "
SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN doctor_approved_at IS NULL THEN 1 ELSE 0 END) as pendentes,
    SUM(CASE WHEN doctor_approved_at IS NOT NULL AND (doctor_activation_token IS NULL OR doctor_activation_token = '') THEN 1 ELSE 0 END) as aprovados_ativados,
    SUM(CASE WHEN doctor_approved_at IS NOT NULL AND doctor_activation_token IS NOT NULL AND doctor_activation_token != '' THEN 1 ELSE 0 END) as aprovados_nao_ativados,
    SUM(CASE WHEN is_blocked = 1 THEN 1 ELSE 0 END) as bloqueados
FROM users 
WHERE profile='doctor';
" 2>/dev/null

echo ""
echo "=========================================="

