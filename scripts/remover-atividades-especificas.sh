#!/bin/bash

##############################################
# Script para Remover Atividades Específicas
# Remove "Novo Membro" e "Cuidador bom foi removido"
##############################################

SERVER="10.102.0.103"
USER="darley"
PASSWORD="yhvh77"

echo "🗑️  Removendo Atividades Específicas"
echo "=========================================="
echo ""

sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" << 'ENDSSH'
cd /var/www/lacos-backend

echo "📋 Buscando atividades a remover..."
mysql -u lacos -pLacos2025Secure lacos << 'SQL'
SELECT id, action_type, description, created_at 
FROM group_activities 
WHERE description LIKE '%Cuidador bom%' 
   OR (action_type = 'member_joined' AND description LIKE '%entrou no grupo%')
   OR (action_type = 'member_removed' AND description LIKE '%foi removido%')
ORDER BY created_at DESC;
SQL

echo ""
echo "🗑️  Removendo atividades..."
mysql -u lacos -pLacos2025Secure lacos << 'SQL'
DELETE FROM group_activities 
WHERE description LIKE '%Cuidador bom%' 
   OR (action_type = 'member_joined' AND description LIKE '%entrou no grupo%' AND created_at < DATE_SUB(NOW(), INTERVAL 3 DAY))
   OR (action_type = 'member_removed' AND description LIKE '%foi removido%');
SQL

echo "✅ Remoção concluída!"
echo ""
echo "📊 Total de atividades restantes:"
mysql -u lacos -pLacos2025Secure lacos << 'SQL'
SELECT COUNT(*) as total FROM group_activities;
SQL

echo ""
echo "📋 Últimas 5 atividades:"
mysql -u lacos -pLacos2025Secure lacos << 'SQL'
SELECT id, action_type, description, created_at 
FROM group_activities 
ORDER BY created_at DESC 
LIMIT 5;
SQL

ENDSSH

echo ""
echo "✅ Processo concluído!"

