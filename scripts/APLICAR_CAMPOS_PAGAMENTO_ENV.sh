#!/bin/bash

# Script para adicionar campos de pagamento usando credenciais do .env
# Servidor: 193.203.182.22

echo "🔧 Adicionando campos de pagamento na tabela appointments..."

sshpass -p 'yhvh77' ssh -p 63022 -o StrictHostKeyChecking=no darley@193.203.182.22 << 'ENDSSH'
cd /var/www/lacos-backend

# Ler credenciais do .env
DB_USER=$(sudo grep "^DB_USERNAME=" .env | cut -d '=' -f2)
DB_PASS=$(sudo grep "^DB_PASSWORD=" .env | cut -d '=' -f2)
DB_NAME=$(sudo grep "^DB_DATABASE=" .env | cut -d '=' -f2)

echo "📋 Usando credenciais: DB_USER=$DB_USER, DB_NAME=$DB_NAME"

# Aplicar campos um por um
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << 'SQL'
-- payment_status
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'payment_status');
SET @sql = IF(@exists = 0, 
  "ALTER TABLE appointments ADD COLUMN payment_status ENUM('pending', 'paid_held', 'released', 'refunded') DEFAULT 'pending' AFTER status;",
  "SELECT 'payment_status já existe' AS message;");
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- amount
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'amount');
SET @sql = IF(@exists = 0, 
  "ALTER TABLE appointments ADD COLUMN amount DECIMAL(10, 2) NULL AFTER payment_status;",
  "SELECT 'amount já existe' AS message;");
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- payment_id
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'payment_id');
SET @sql = IF(@exists = 0, 
  "ALTER TABLE appointments ADD COLUMN payment_id VARCHAR(255) NULL AFTER amount;",
  "SELECT 'payment_id já existe' AS message;");
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- payment_hold_id
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'payment_hold_id');
SET @sql = IF(@exists = 0, 
  "ALTER TABLE appointments ADD COLUMN payment_hold_id VARCHAR(255) NULL AFTER payment_id;",
  "SELECT 'payment_hold_id já existe' AS message;");
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- refund_id
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'refund_id');
SET @sql = IF(@exists = 0, 
  "ALTER TABLE appointments ADD COLUMN refund_id VARCHAR(255) NULL AFTER payment_hold_id;",
  "SELECT 'refund_id já existe' AS message;");
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- paid_at
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'paid_at');
SET @sql = IF(@exists = 0, 
  "ALTER TABLE appointments ADD COLUMN paid_at DATETIME NULL AFTER refund_id;",
  "SELECT 'paid_at já existe' AS message;");
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- held_at
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'held_at');
SET @sql = IF(@exists = 0, 
  "ALTER TABLE appointments ADD COLUMN held_at DATETIME NULL AFTER paid_at;",
  "SELECT 'held_at já existe' AS message;");
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- released_at
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'released_at');
SET @sql = IF(@exists = 0, 
  "ALTER TABLE appointments ADD COLUMN released_at DATETIME NULL AFTER held_at;",
  "SELECT 'released_at já existe' AS message;");
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- refunded_at
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'refunded_at');
SET @sql = IF(@exists = 0, 
  "ALTER TABLE appointments ADD COLUMN refunded_at DATETIME NULL AFTER released_at;",
  "SELECT 'refunded_at já existe' AS message;");
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- confirmed_at
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'confirmed_at');
SET @sql = IF(@exists = 0, 
  "ALTER TABLE appointments ADD COLUMN confirmed_at DATETIME NULL AFTER refunded_at;",
  "SELECT 'confirmed_at já existe' AS message;");
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- confirmed_by
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'confirmed_by');
SET @sql = IF(@exists = 0, 
  "ALTER TABLE appointments ADD COLUMN confirmed_by ENUM('patient', 'system_auto', 'system_doctor_absence', 'system_patient_absence') NULL AFTER confirmed_at;",
  "SELECT 'confirmed_by já existe' AS message;");
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- cancelled_by
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'cancelled_by');
SET @sql = IF(@exists = 0, 
  "ALTER TABLE appointments ADD COLUMN cancelled_by ENUM('doctor', 'patient', 'system_doctor_absence', 'system_patient_absence') NULL AFTER confirmed_by;",
  "SELECT 'cancelled_by já existe' AS message;");
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- doctor_amount
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'doctor_amount');
SET @sql = IF(@exists = 0, 
  "ALTER TABLE appointments ADD COLUMN doctor_amount DECIMAL(10, 2) NULL AFTER cancelled_by;",
  "SELECT 'doctor_amount já existe' AS message;");
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- platform_amount
SET @exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE table_schema = DATABASE() AND table_name = 'appointments' AND column_name = 'platform_amount');
SET @sql = IF(@exists = 0, 
  "ALTER TABLE appointments ADD COLUMN platform_amount DECIMAL(10, 2) NULL AFTER doctor_amount;",
  "SELECT 'platform_amount já existe' AS message;");
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT '✅ Campos de pagamento verificados/adicionados!' AS message;
SQL

echo ""
echo "📋 Verificando campos criados..."
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "DESCRIBE appointments;" | grep -E 'payment|amount|refund|hold|confirmed|cancelled' | head -20

ENDSSH

echo "✅ Concluído!"

