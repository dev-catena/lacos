#!/bin/bash

# Script para corrigir foreign key de doctor_id na tabela appointments
# Servidor: 193.203.182.22
# Usuário: darley
# Senha: yhvh77

echo "🔧 Corrigindo foreign key de doctor_id na tabela appointments..."

SERVER="darley@193.203.182.22"

sshpass -p 'yhvh77' ssh "$SERVER" bash << 'ENDSSH'
cd /var/www/lacos-backend

echo "📋 Verificando foreign keys atuais da tabela appointments..."
echo 'yhvh77' | sudo -S mysql -u root lacos << 'SQL' 2>/dev/null || mysql -u root -p'root123' lacos << 'SQL' 2>/dev/null || mysql lacos << 'SQL'
SHOW CREATE TABLE appointments\G
SQL

echo ""
echo "📝 Removendo foreign key antiga (appointments_doctor_id_foreign)..."
echo 'yhvh77' | sudo -S mysql -u root lacos << 'SQL' 2>/dev/null || mysql -u root -p'root123' lacos << 'SQL' 2>/dev/null || mysql lacos << 'SQL'
ALTER TABLE appointments 
DROP FOREIGN KEY appointments_doctor_id_foreign;
SQL

if [ $? -eq 0 ]; then
    echo "✅ Foreign key antiga removida com sucesso!"
else
    echo "⚠️ Tentando encontrar o nome exato da constraint..."
    echo 'yhvh77' | sudo -S mysql -u root lacos << 'SQL' 2>/dev/null || mysql -u root -p'root123' lacos << 'SQL' 2>/dev/null || mysql lacos << 'SQL'
SELECT CONSTRAINT_NAME 
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'lacos' 
  AND TABLE_NAME = 'appointments' 
  AND COLUMN_NAME = 'doctor_id' 
  AND REFERENCED_TABLE_NAME IS NOT NULL;
SQL
    
    # Tentar remover com o nome encontrado ou tentar sem especificar o nome
    echo ""
    echo "📝 Tentando remover todas as foreign keys de doctor_id..."
    echo 'yhvh77' | sudo -S mysql -u root lacos << 'SQL' 2>/dev/null || mysql -u root -p'root123' lacos << 'SQL' 2>/dev/null || mysql lacos << 'SQL'
SET @constraint_name = (
    SELECT CONSTRAINT_NAME 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = 'lacos' 
      AND TABLE_NAME = 'appointments' 
      AND COLUMN_NAME = 'doctor_id' 
      AND REFERENCED_TABLE_NAME IS NOT NULL
    LIMIT 1
);
SET @sql = CONCAT('ALTER TABLE appointments DROP FOREIGN KEY ', @constraint_name);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SQL
fi

echo ""
echo "📋 Verificando estrutura atualizada..."
echo 'yhvh77' | sudo -S mysql -u root lacos << 'SQL' 2>/dev/null || mysql -u root -p'root123' lacos << 'SQL' 2>/dev/null || mysql lacos << 'SQL'
SHOW CREATE TABLE appointments\G
SQL

ENDSSH

echo "✅ Concluído!"

