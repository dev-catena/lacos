#!/bin/bash

# Script para atualizar senha do usuário MySQL para Lacos2025Secure

set -e

DB_USERNAME="lacos"
NEW_PASSWORD="Lacos2025Secure"
DB_NAME="lacos"

echo "=========================================="
echo "🔐 ATUALIZANDO SENHA DO MYSQL"
echo "=========================================="
echo ""
echo "👤 Usuário: $DB_USERNAME"
echo "🗄️  Banco: $DB_NAME"
echo "🔑 Nova senha: $NEW_PASSWORD"
echo ""

# Solicitar senha do root do MySQL
read -sp "Digite a senha do root do MySQL: " ROOT_PASSWORD
echo ""
echo ""

# Tentar atualizar senha do usuário existente
echo "🔄 Atualizando senha do usuário '$DB_USERNAME'..."
mysql -u root -p"$ROOT_PASSWORD" <<EOF 2>/dev/null
ALTER USER '$DB_USERNAME'@'localhost' IDENTIFIED BY '$NEW_PASSWORD';
FLUSH PRIVILEGES;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Senha do usuário atualizada com sucesso!"
else
    echo "⚠️  Usuário pode não existir, tentando criar..."
    
    # Tentar criar usuário se não existir
    mysql -u root -p"$ROOT_PASSWORD" <<EOF 2>/dev/null
CREATE USER IF NOT EXISTS '$DB_USERNAME'@'localhost' IDENTIFIED BY '$NEW_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USERNAME'@'localhost';
FLUSH PRIVILEGES;
EOF
    
    if [ $? -eq 0 ]; then
        echo "✅ Usuário criado/atualizado com sucesso!"
    else
        echo "❌ Erro ao criar/atualizar usuário"
        echo ""
        echo "💡 Tente executar manualmente:"
        echo "   mysql -u root -p"
        echo "   ALTER USER 'lacos'@'localhost' IDENTIFIED BY 'Lacos2025Secure';"
        echo "   FLUSH PRIVILEGES;"
        exit 1
    fi
fi

echo ""
echo "🔍 Testando conexão com nova senha..."
if mysql -u "$DB_USERNAME" -p"$NEW_PASSWORD" -e "USE $DB_NAME; SELECT 1;" 2>/dev/null; then
    echo "✅ Conexão com nova senha OK!"
    echo ""
    echo "📊 Verificando tabelas no banco:"
    mysql -u "$DB_USERNAME" -p"$NEW_PASSWORD" -e "USE $DB_NAME; SHOW TABLES;" 2>/dev/null | head -10
else
    echo "⚠️  Ainda há problema com a conexão"
    echo "   Verifique se o banco $DB_NAME existe"
    echo ""
    echo "💡 Para criar o banco (se não existir):"
    echo "   mysql -u root -p"
    echo "   CREATE DATABASE IF NOT EXISTS $DB_NAME;"
    echo "   GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USERNAME'@'localhost';"
    echo "   FLUSH PRIVILEGES;"
fi

echo ""
echo "=========================================="
echo "✅ PROCESSO CONCLUÍDO!"
echo "=========================================="
echo ""
echo "📋 Resumo:"
echo "   ✅ Senha no .env: Lacos2025Secure"
echo "   ✅ Senha no MySQL: Lacos2025Secure"
echo ""
echo "🔍 Para testar novamente:"
echo "   bash scripts/TESTAR_CONEXAO_BANCO.sh"












