#!/bin/bash

# Script para marcar migrations como executadas quando as tabelas já existem
# Usa usuário lacos

DB_USER="lacos"
DB_PASS="Lacos2025Secure"
DB_NAME="lacos"

echo "🔍 Verificando migrations pendentes que tentam criar tabelas já existentes..."

cd /var/www/lacos-backend || exit 1

# Listar todas as migrations pendentes
PENDING_MIGRATIONS=$(php artisan migrate:status 2>/dev/null | grep "Pending" | awk '{print $2}')

if [ -z "$PENDING_MIGRATIONS" ]; then
    echo "✅ Nenhuma migration pendente!"
    exit 0
fi

echo "📋 Migrations pendentes encontradas:"
echo "$PENDING_MIGRATIONS"
echo ""

# Para cada migration pendente, verificar se a tabela já existe
for migration in $PENDING_MIGRATIONS; do
    echo "🔍 Verificando: $migration"
    
    # Extrair nome da tabela da migration (tentativa básica)
    # Isso é uma aproximação - pode precisar de ajuste manual
    TABLE_NAME=$(echo "$migration" | sed -E 's/.*create_([^_]+)_table.*/\1/' | sed 's/_table$//')
    
    # Verificar se a tabela existe
    TABLE_EXISTS=$(mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -sN -e "SHOW TABLES LIKE '$TABLE_NAME';" 2>/dev/null)
    
    if [ -n "$TABLE_EXISTS" ]; then
        echo "   ✅ Tabela '$TABLE_NAME' já existe - marcando migration como executada"
        
        # Pegar próximo batch
        NEXT_BATCH=$(mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -sN -e "SELECT COALESCE(MAX(batch), 0) + 1 FROM migrations;" 2>/dev/null)
        
        # Marcar como executada
        mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "INSERT INTO migrations (migration, batch) VALUES ('$migration', $NEXT_BATCH) ON DUPLICATE KEY UPDATE migration=migration;" 2>/dev/null
        
        echo "   ✅ Migration '$migration' marcada como executada (batch $NEXT_BATCH)"
    else
        echo "   ⚠️  Tabela '$TABLE_NAME' não existe - migration será executada normalmente"
    fi
    echo ""
done

echo "🚀 Executando migrations restantes..."
sudo -u www-data php artisan migrate --force




