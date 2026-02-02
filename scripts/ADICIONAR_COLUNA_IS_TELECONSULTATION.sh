#!/bin/bash

# Script para adicionar coluna is_teleconsultation na tabela appointments
# Servidor: 10.102.0.103
# Usuário: darley
# Senha: yhvh77

echo "🔧 Adicionando coluna is_teleconsultation na tabela appointments..."

SERVER="darley@10.102.0.103"

sshpass -p 'yhvh77' ssh "$SERVER" bash << 'ENDSSH'
cd /var/www/lacos-backend

echo "📋 Verificando estrutura atual da tabela appointments..."
echo 'yhvh77' | sudo -S mysql -u root lacos -e "DESCRIBE appointments;" 2>/dev/null || mysql -u root lacos -e "DESCRIBE appointments;" 2>/dev/null

echo ""
echo "📝 Adicionando coluna is_teleconsultation..."
echo 'yhvh77' | sudo -S mysql -u root lacos << 'SQL'
ALTER TABLE appointments 
ADD COLUMN is_teleconsultation TINYINT(1) DEFAULT 0 
AFTER doctor_id;
SQL

if [ $? -eq 0 ]; then
    echo "✅ Coluna is_teleconsultation adicionada com sucesso!"
else
    echo "⚠️ Tentando sem sudo..."
    mysql -u root lacos << 'SQL'
ALTER TABLE appointments 
ADD COLUMN is_teleconsultation TINYINT(1) DEFAULT 0 
AFTER doctor_id;
SQL
fi

echo ""
echo "📋 Verificando estrutura atualizada..."
echo 'yhvh77' | sudo -S mysql -u root lacos -e "DESCRIBE appointments;" 2>/dev/null | grep -i teleconsultation || mysql -u root lacos -e "DESCRIBE appointments;" 2>/dev/null | grep -i teleconsultation

ENDSSH

echo "✅ Concluído!"

