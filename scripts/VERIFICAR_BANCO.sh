#!/bin/bash

# Script para verificar conexão e criar banco usando usuário lacos
# Credenciais: USER=lacos, PASS=Lacos2025Secure, DB=lacos

echo "🔍 Verificando conexão com MySQL usando usuário 'lacos'..."

# Credenciais
DB_USER="lacos"
DB_PASS="Lacos2025Secure"
DB_NAME="lacos"

# Testar conexão
if mysql -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1;" &> /dev/null; then
    echo "✅ Conexão com MySQL bem-sucedida!"
else
    echo "❌ Não foi possível conectar ao MySQL"
    echo "   Verifique se:"
    echo "   1. O usuário '$DB_USER' existe"
    echo "   2. A senha está correta"
    echo "   3. O MySQL está rodando"
    exit 1
fi

echo ""
echo "🔍 Verificando se o banco '$DB_NAME' existe..."

# Verificar se o banco existe
if mysql -u "$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME;" &> /dev/null; then
    echo "✅ Banco '$DB_NAME' existe!"
    
    # Mostrar tabelas existentes
    echo ""
    echo "📊 Tabelas existentes:"
    mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null | tail -n +2
    
    # Contar tabelas
    TABLE_COUNT=$(mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES;" 2>/dev/null | tail -n +2 | wc -l)
    echo ""
    echo "   Total de tabelas: $TABLE_COUNT"
else
    echo "⚠️  Banco '$DB_NAME' não existe!"
    echo ""
    echo "🔄 Tentando criar o banco..."
    
    # Tentar criar o banco
    if mysql -u "$DB_USER" -p"$DB_PASS" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null; then
        echo "✅ Banco '$DB_NAME' criado com sucesso!"
    else
        echo "❌ Não foi possível criar o banco '$DB_NAME'"
        echo "   O usuário '$DB_USER' pode não ter permissão para criar bancos."
        echo "   Peça ao administrador do banco para criar o banco ou conceder permissões."
        exit 1
    fi
fi

echo ""
echo "✨ Verificação concluída!"




