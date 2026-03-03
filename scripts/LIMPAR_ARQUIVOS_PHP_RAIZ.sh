#!/bin/bash

# Script para limpar arquivos PHP desnecessários da raiz

set -e

PROJECT_DIR="/home/darley/lacos"
BACKUP_DIR="$PROJECT_DIR/backups/php-backups-$(date +%Y%m%d_%H%M%S)"

echo "=========================================="
echo "🧹 LIMPANDO ARQUIVOS PHP DA RAIZ"
echo "=========================================="
echo ""

cd "$PROJECT_DIR"

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"
echo "📁 Diretório de backup criado: $BACKUP_DIR"
echo ""

# Verificar migration
MIGRATION_FILE="add_personal_data_fields_to_users_table.php"
if [ -f "$MIGRATION_FILE" ]; then
    echo "📋 Verificando migration: $MIGRATION_FILE"
    
    # Verificar se já existe em migrations
    if [ -f "backend-laravel/database/migrations/$(basename $MIGRATION_FILE)" ]; then
        echo "   ⚠️  Migration já existe em migrations/, movendo para backup"
        mv "$MIGRATION_FILE" "$BACKUP_DIR/"
    else
        echo "   📦 Movendo para migrations/"
        mv "$MIGRATION_FILE" "backend-laravel/database/migrations/"
    fi
fi

# Mover script de teste
TEST_FILE="test_clients_photos.php"
if [ -f "$TEST_FILE" ]; then
    echo "📋 Movendo script de teste: $TEST_FILE"
    mv "$TEST_FILE" "scripts/" || mv "$TEST_FILE" "$BACKUP_DIR/"
fi

# Mover backups de rotas
echo "📋 Movendo backups de rotas..."
for file in routes_api_*.php; do
    if [ -f "$file" ]; then
        echo "   📦 $file → backup"
        mv "$file" "$BACKUP_DIR/"
    fi
done

# Mover backups de controllers
echo "📋 Movendo backups de controllers..."
for file in UserController_*.php; do
    if [ -f "$file" ]; then
        echo "   📦 $file → backup"
        mv "$file" "$BACKUP_DIR/"
    fi
done

# Mover backups de models
echo "📋 Movendo backups de models..."
for file in User_MODEL_*.php; do
    if [ -f "$file" ]; then
        echo "   📦 $file → backup"
        mv "$file" "$BACKUP_DIR/"
    fi
done

echo ""
echo "=========================================="
echo "✅ LIMPEZA CONCLUÍDA!"
echo "=========================================="
echo ""
echo "📁 Backups salvos em: $BACKUP_DIR"
echo ""
echo "📊 Arquivos PHP restantes na raiz:"
ls -1 *.php 2>/dev/null | wc -l || echo "   0 arquivos"
echo ""
echo "💡 Para restaurar algum arquivo:"
echo "   cp $BACKUP_DIR/nome_do_arquivo.php ."
echo ""












