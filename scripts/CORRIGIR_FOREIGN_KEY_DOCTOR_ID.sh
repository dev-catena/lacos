#!/bin/bash

# Script para corrigir foreign key de doctor_id na tabela appointments
# Servidor: 192.168.0.20
# Usuário: darley
# Senha: yhvh77

echo "🔧 Corrigindo foreign key de doctor_id na tabela appointments..."

SERVER="darley@192.168.0.20"

sshpass -p 'yhvh77' ssh "$SERVER" bash << 'ENDSSH'
cd /var/www/lacos-backend

echo "📋 Verificando foreign keys atuais da tabela appointments..."
mysql -u root lacos << 'SQL'
SHOW CREATE TABLE appointments\G
SQL

echo ""
echo "📝 Removendo foreign key antiga (appointments_doctor_id_foreign)..."
mysql -u root lacos << 'SQL'
ALTER TABLE appointments 
DROP FOREIGN KEY appointments_doctor_id_foreign;
SQL

if [ $? -eq 0 ]; then
    echo "✅ Foreign key antiga removida com sucesso!"
else
    echo "⚠️ Erro ao remover foreign key (pode não existir ou ter nome diferente)"
    # Tentar encontrar o nome exato da constraint
    mysql -u root lacos << 'SQL'
SELECT CONSTRAINT_NAME 
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'lacos' 
  AND TABLE_NAME = 'appointments' 
  AND COLUMN_NAME = 'doctor_id' 
  AND REFERENCED_TABLE_NAME IS NOT NULL;
SQL
fi

echo ""
echo "📋 Verificando estrutura atualizada..."
mysql -u root lacos << 'SQL'
SHOW CREATE TABLE appointments\G
SQL

ENDSSH

echo "✅ Concluído!"

