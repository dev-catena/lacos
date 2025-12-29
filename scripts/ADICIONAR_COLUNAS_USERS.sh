#!/bin/bash

echo "🔧 Adicionando colunas de dados pessoais na tabela users..."
echo ""

cd /var/www/lacos-backend || exit 1

DB_NAME="lacos"
DB_USER="lacos"
DB_PASS="Lacos2025Secure"

# Verificar se as colunas existem e adicionar apenas as que faltam
echo "📋 Verificando colunas existentes..."

# last_name
if mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW COLUMNS FROM users LIKE 'last_name';" 2>/dev/null | grep -q "last_name"; then
    echo "✅ Coluna last_name já existe"
else
    echo "➕ Adicionando coluna last_name..."
    mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "ALTER TABLE users ADD COLUMN last_name VARCHAR(255) NULL AFTER name;" 2>/dev/null && echo "✅ last_name adicionada" || echo "❌ Erro ao adicionar last_name"
fi

# cpf
if mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW COLUMNS FROM users LIKE 'cpf';" 2>/dev/null | grep -q "cpf"; then
    echo "✅ Coluna cpf já existe"
else
    echo "➕ Adicionando coluna cpf..."
    mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "ALTER TABLE users ADD COLUMN cpf VARCHAR(14) NULL AFTER birth_date;" 2>/dev/null && echo "✅ cpf adicionada" || echo "❌ Erro ao adicionar cpf"
fi

# address
if mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW COLUMNS FROM users LIKE 'address';" 2>/dev/null | grep -q "address"; then
    echo "✅ Coluna address já existe"
else
    echo "➕ Adicionando coluna address..."
    mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "ALTER TABLE users ADD COLUMN address VARCHAR(255) NULL AFTER cpf;" 2>/dev/null && echo "✅ address adicionada" || echo "❌ Erro ao adicionar address"
fi

# address_number
if mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW COLUMNS FROM users LIKE 'address_number';" 2>/dev/null | grep -q "address_number"; then
    echo "✅ Coluna address_number já existe"
else
    echo "➕ Adicionando coluna address_number..."
    mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "ALTER TABLE users ADD COLUMN address_number VARCHAR(20) NULL AFTER address;" 2>/dev/null && echo "✅ address_number adicionada" || echo "❌ Erro ao adicionar address_number"
fi

# address_complement
if mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW COLUMNS FROM users LIKE 'address_complement';" 2>/dev/null | grep -q "address_complement"; then
    echo "✅ Coluna address_complement já existe"
else
    echo "➕ Adicionando coluna address_complement..."
    mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "ALTER TABLE users ADD COLUMN address_complement VARCHAR(255) NULL AFTER address_number;" 2>/dev/null && echo "✅ address_complement adicionada" || echo "❌ Erro ao adicionar address_complement"
fi

# state
if mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW COLUMNS FROM users LIKE 'state';" 2>/dev/null | grep -q "state"; then
    echo "✅ Coluna state já existe"
else
    echo "➕ Adicionando coluna state..."
    mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "ALTER TABLE users ADD COLUMN state VARCHAR(2) NULL AFTER city;" 2>/dev/null && echo "✅ state adicionada" || echo "❌ Erro ao adicionar state"
fi

# zip_code
if mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW COLUMNS FROM users LIKE 'zip_code';" 2>/dev/null | grep -q "zip_code"; then
    echo "✅ Coluna zip_code já existe"
else
    echo "➕ Adicionando coluna zip_code..."
    mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "ALTER TABLE users ADD COLUMN zip_code VARCHAR(10) NULL AFTER state;" 2>/dev/null && echo "✅ zip_code adicionada" || echo "❌ Erro ao adicionar zip_code"
fi

echo ""
echo "✅ Verificação concluída!"
echo ""

