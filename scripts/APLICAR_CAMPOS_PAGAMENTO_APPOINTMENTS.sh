#!/bin/bash

# Script para adicionar campos de pagamento na tabela appointments
# Servidor: 10.102.0.103
# Usuário: darley
# Senha: yhvh77

echo "🔧 Adicionando campos de pagamento na tabela appointments..."

SERVER="darley@10.102.0.103"
PASSWORD="yhvh77"

sshpass -p "$PASSWORD" ssh -p 63022 "$SERVER" bash << 'ENDSSH'
cd /var/www/lacos-backend

echo "📋 Verificando campos existentes..."
echo 'yhvh77' | sudo -S mysql -u root lacos << 'SQL'
-- Verificar se campos já existem antes de adicionar
SET @dbname = DATABASE();
SET @tablename = "appointments";
SET @columnname = "payment_status";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Campo payment_status já existe' AS message;",
  "ALTER TABLE appointments ADD COLUMN payment_status ENUM('pending', 'paid_held', 'released', 'refunded') DEFAULT 'pending' AFTER status;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
SQL

echo 'yhvh77' | sudo -S mysql -u root lacos << 'SQL'
SET @dbname = DATABASE();
SET @tablename = "appointments";
SET @columnname = "amount";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Campo amount já existe' AS message;",
  "ALTER TABLE appointments ADD COLUMN amount DECIMAL(10, 2) NULL AFTER payment_status;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
SQL

echo 'yhvh77' | sudo -S mysql -u root lacos << 'SQL'
SET @dbname = DATABASE();
SET @tablename = "appointments";
SET @columnname = "payment_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Campo payment_id já existe' AS message;",
  "ALTER TABLE appointments ADD COLUMN payment_id VARCHAR(255) NULL AFTER amount;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
SQL

echo 'yhvh77' | sudo -S mysql -u root lacos << 'SQL'
SET @dbname = DATABASE();
SET @tablename = "appointments";
SET @columnname = "payment_hold_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Campo payment_hold_id já existe' AS message;",
  "ALTER TABLE appointments ADD COLUMN payment_hold_id VARCHAR(255) NULL AFTER payment_id;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
SQL

echo 'yhvh77' | sudo -S mysql -u root lacos << 'SQL'
SET @dbname = DATABASE();
SET @tablename = "appointments";
SET @columnname = "refund_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Campo refund_id já existe' AS message;",
  "ALTER TABLE appointments ADD COLUMN refund_id VARCHAR(255) NULL AFTER payment_hold_id;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
SQL

echo 'yhvh77' | sudo -S mysql -u root lacos << 'SQL'
SET @dbname = DATABASE();
SET @tablename = "appointments";
SET @columnname = "paid_at";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Campo paid_at já existe' AS message;",
  "ALTER TABLE appointments ADD COLUMN paid_at DATETIME NULL AFTER refund_id;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
SQL

echo 'yhvh77' | sudo -S mysql -u root lacos << 'SQL'
SET @dbname = DATABASE();
SET @tablename = "appointments";
SET @columnname = "held_at";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Campo held_at já existe' AS message;",
  "ALTER TABLE appointments ADD COLUMN held_at DATETIME NULL AFTER paid_at;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
SQL

echo 'yhvh77' | sudo -S mysql -u root lacos << 'SQL'
SET @dbname = DATABASE();
SET @tablename = "appointments";
SET @columnname = "released_at";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Campo released_at já existe' AS message;",
  "ALTER TABLE appointments ADD COLUMN released_at DATETIME NULL AFTER held_at;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
SQL

echo 'yhvh77' | sudo -S mysql -u root lacos << 'SQL'
SET @dbname = DATABASE();
SET @tablename = "appointments";
SET @columnname = "refunded_at";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Campo refunded_at já existe' AS message;",
  "ALTER TABLE appointments ADD COLUMN refunded_at DATETIME NULL AFTER released_at;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
SQL

echo 'yhvh77' | sudo -S mysql -u root lacos << 'SQL'
SET @dbname = DATABASE();
SET @tablename = "appointments";
SET @columnname = "confirmed_at";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Campo confirmed_at já existe' AS message;",
  "ALTER TABLE appointments ADD COLUMN confirmed_at DATETIME NULL AFTER refunded_at;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
SQL

echo 'yhvh77' | sudo -S mysql -u root lacos << 'SQL'
SET @dbname = DATABASE();
SET @tablename = "appointments";
SET @columnname = "confirmed_by";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Campo confirmed_by já existe' AS message;",
  "ALTER TABLE appointments ADD COLUMN confirmed_by ENUM('patient', 'system_auto', 'system_doctor_absence', 'system_patient_absence') NULL AFTER confirmed_at;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
SQL

echo 'yhvh77' | sudo -S mysql -u root lacos << 'SQL'
SET @dbname = DATABASE();
SET @tablename = "appointments";
SET @columnname = "cancelled_by";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Campo cancelled_by já existe' AS message;",
  "ALTER TABLE appointments ADD COLUMN cancelled_by ENUM('doctor', 'patient', 'system_doctor_absence', 'system_patient_absence') NULL AFTER confirmed_by;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
SQL

echo 'yhvh77' | sudo -S mysql -u root lacos << 'SQL'
SET @dbname = DATABASE();
SET @tablename = "appointments";
SET @columnname = "doctor_amount";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Campo doctor_amount já existe' AS message;",
  "ALTER TABLE appointments ADD COLUMN doctor_amount DECIMAL(10, 2) NULL AFTER cancelled_by;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
SQL

echo 'yhvh77' | sudo -S mysql -u root lacos << 'SQL'
SET @dbname = DATABASE();
SET @tablename = "appointments";
SET @columnname = "platform_amount";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 'Campo platform_amount já existe' AS message;",
  "ALTER TABLE appointments ADD COLUMN platform_amount DECIMAL(10, 2) NULL AFTER doctor_amount;"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
SQL

echo ""
echo "✅ Campos de pagamento adicionados!"
echo ""
echo "📋 Verificando campos criados..."
echo 'yhvh77' | sudo -S mysql -u root lacos -e "DESCRIBE appointments;" 2>/dev/null | grep -E 'payment|amount|refund|hold|confirmed|cancelled' | head -20

ENDSSH

echo "✅ Concluído!"

