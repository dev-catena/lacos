#!/bin/bash

# Script para atualizar senha do usuário do banco de dados

set -e

DB_USERNAME="lacos"
OLD_PASSWORD="Lacos2025Secure"
NEW_PASSWORD="pLacos2025Secure"
DB_NAME="lacos"

echo "=========================================="
echo "🔐 ATUALIZANDO SENHA DO BANCO DE DADOS"
echo "=========================================="
echo ""
echo "👤 Usuário: $DB_USERNAME"
echo "🗄️  Banco: $DB_NAME"
echo "🔑 Nova senha: $NEW_PASSWORD"
echo ""

# Solicitar senha do root do MySQL
read -sp "Digite a senha do root do MySQL: " ROOT_PASSWORD
echo ""

# Atualizar senha do usuário
echo "🔄 Atualizando senha do usuário..."
mysql -u root -p"$ROOT_PASSWORD" <<EOF 2>/dev/null
ALTER USER '$DB_USERNAME'@'localhost' IDENTIFIED BY '$NEW_PASSWORD';
FLUSH PRIVILEGES;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Senha do usuário atualizada com sucesso!"
else
    echo "❌ Erro ao atualizar senha"
    echo ""
    echo "💡 Tentando criar usuário se não existir..."
    mysql -u root -p"$ROOT_PASSWORD" <<EOF 2>/dev/null
CREATE USER IF NOT EXISTS '$DB_USERNAME'@'localhost' IDENTIFIED BY '$NEW_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USERNAME'@'localhost';
FLUSH PRIVILEGES;
EOF
    
    if [ $? -eq 0 ]; then
        echo "✅ Usuário criado/atualizado com sucesso!"
    else
        echo "❌ Erro ao criar/atualizar usuário"
        exit 1
    fi
fi

echo ""
echo "🔍 Testando nova conexão..."
if mysql -u "$DB_USERNAME" -p"$NEW_PASSWORD" -e "USE $DB_NAME; SELECT 1;" 2>/dev/null; then
    echo "✅ Conexão com nova senha OK!"
else
    echo "❌ Ainda há problema com a conexão"
    echo "   Verifique se o banco $DB_NAME existe"
fi

echo ""
echo "=========================================="
echo "✅ PROCESSO CONCLUÍDO!"
echo "=========================================="












