#!/bin/bash

##############################################
# Script para Limpar Atividades de Teste
# Remove atividades com descrições suspeitas
##############################################

SERVER="10.102.0.103"
USER="darley"
PASSWORD="yhvh77"
REMOTE_PATH="/var/www/lacos-backend"

echo "🧹 Limpando Atividades de Teste"
echo "=========================================="
echo ""

sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" << 'ENDSSH'
cd /var/www/lacos-backend

echo "📊 Atividades antes da limpeza:"
mysql -u lacos -pLacos2025Secure lacos << 'SQL'
SELECT COUNT(*) as total FROM group_activities;
SQL

echo ""
echo "🗑️  Removendo atividades suspeitas..."
echo ""

# Remover atividades com descrições de teste
mysql -u lacos -pLacos2025Secure lacos << 'SQL'
DELETE FROM group_activities 
WHERE description LIKE '%Cuidador bom%' 
   OR description LIKE '%teste%'
   OR description LIKE '%Teste%'
   OR description LIKE '%mock%'
   OR description LIKE '%Mock%'
   OR description LIKE '%exemplo%'
   OR description LIKE '%Exemplo%';
SQL

echo "✅ Limpeza concluída!"
echo ""
echo "📊 Atividades após a limpeza:"
mysql -u lacos -pLacos2025Secure lacos << 'SQL'
SELECT COUNT(*) as total FROM group_activities;
SQL

echo ""
echo "📋 Últimas 5 atividades restantes:"
mysql -u lacos -pLacos2025Secure lacos << 'SQL'
SELECT id, action_type, description, created_at 
FROM group_activities 
ORDER BY created_at DESC 
LIMIT 5;
SQL

ENDSSH

echo ""
echo "✅ Processo concluído!"

