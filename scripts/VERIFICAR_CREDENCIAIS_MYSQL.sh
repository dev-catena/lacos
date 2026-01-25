#!/bin/bash

# Script para verificar credenciais do MySQL e corrigir foreign key
# Servidor: 10.102.0.103
# Usuário: darley
# Senha: yhvh77

echo "🔧 Verificando credenciais do MySQL e corrigindo foreign key..."

SERVER="darley@10.102.0.103"

sshpass -p 'yhvh77' ssh "$SERVER" bash << 'ENDSSH'
cd /var/www/lacos-backend

echo "📋 Verificando credenciais do MySQL no .env..."
DB_USER=$(grep "^DB_USERNAME=" .env | cut -d '=' -f2)
DB_PASS=$(grep "^DB_PASSWORD=" .env | cut -d '=' -f2)
DB_NAME=$(grep "^DB_DATABASE=" .env | cut -d '=' -f2)

echo "DB_USER: $DB_USER"
echo "DB_NAME: $DB_NAME"
echo "DB_PASS: ${DB_PASS:0:3}***"

echo ""
echo "📋 Verificando foreign keys atuais da tabela appointments..."
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << 'SQL'
SHOW CREATE TABLE appointments\G
SQL

echo ""
echo "📝 Removendo foreign key antiga (appointments_doctor_id_foreign)..."
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << 'SQL'
ALTER TABLE appointments 
DROP FOREIGN KEY appointments_doctor_id_foreign;
SQL

if [ $? -eq 0 ]; then
    echo "✅ Foreign key antiga removida com sucesso!"
else
    echo "⚠️ Tentando encontrar e remover a constraint dinamicamente..."
    mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << 'SQL'
SET @constraint_name = (
    SELECT CONSTRAINT_NAME 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'appointments' 
      AND COLUMN_NAME = 'doctor_id' 
      AND REFERENCED_TABLE_NAME IS NOT NULL
    LIMIT 1
);
SET @sql = CONCAT('ALTER TABLE appointments DROP FOREIGN KEY ', @constraint_name);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SELECT 'Foreign key removida' as resultado;
SQL
fi

echo ""
echo "📋 Verificando estrutura atualizada..."
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << 'SQL'
SHOW CREATE TABLE appointments\G
SQL

ENDSSH

echo "✅ Concluído!"

