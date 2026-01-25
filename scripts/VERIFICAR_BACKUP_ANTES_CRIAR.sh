#!/bin/bash

# Script para verificar backup antes de criar/copiar arquivos faltantes
# Uso: ./VERIFICAR_BACKUP_ANTES_CRIAR.sh <tipo> <nome_arquivo>
# Exemplo: ./VERIFICAR_BACKUP_ANTES_CRIAR.sh controller AuthController
#          ./VERIFICAR_BACKUP_ANTES_CRIAR.sh model User
#          ./VERIFICAR_BACKUP_ANTES_CRIAR.sh migration create_users_table

set -e

# Verificar múltiplos locais de backup
BACKUP_DIRS=(
    "/home/darley/lacos/backup"
    "/home/darley/lacos/backups"
    "/home/darley/lacos_backups"
)

# Encontrar diretório de backup válido
BACKUP_DIR=""
for dir in "${BACKUP_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        BACKUP_DIR="$dir"
        break
    fi
done

if [ -z "$BACKUP_DIR" ]; then
    echo "⚠️  Nenhum diretório de backup encontrado!"
    echo "   Locais verificados:"
    for dir in "${BACKUP_DIRS[@]}"; do
        echo "   - $dir"
    done
    echo ""
    echo "   Continuando sem verificar backup..."
    BACKUP_DIR="/home/darley/lacos/backup" # Fallback
fi
BACKEND_DIR="/home/darley/lacos/backend-laravel"

if [ $# -lt 2 ]; then
    echo "Uso: $0 <tipo> <nome_arquivo>"
    echo ""
    echo "Tipos:"
    echo "  controller - Controller"
    echo "  model      - Model"
    echo "  migration  - Migration"
    echo "  service    - Service"
    echo ""
    echo "Exemplos:"
    echo "  $0 controller AuthController"
    echo "  $0 model User"
    echo "  $0 migration 2024_01_01_create_users_table"
    exit 1
fi

TYPE=$1
FILE_NAME=$2

echo "=========================================="
echo "🔍 VERIFICANDO BACKUP ANTES DE CRIAR"
echo "=========================================="
echo ""
echo "Tipo: $TYPE"
echo "Arquivo: $FILE_NAME"
echo ""

# Determinar caminho no backup baseado no tipo
case $TYPE in
    controller)
        SEARCH_PATHS=(
            "$BACKUP_DIR/backend-laravel/app/Http/Controllers/Api/${FILE_NAME}.php"
            "$BACKUP_DIR/backend-laravel/app/Http/Controllers/${FILE_NAME}.php"
            "$BACKUP_DIR/backend-laravel/${FILE_NAME}.php"
            "$BACKUP_DIR/${FILE_NAME}.php"
        )
        TARGET_DIR="$BACKEND_DIR/app/Http/Controllers/Api"
        ;;
    model)
        SEARCH_PATHS=(
            "$BACKUP_DIR/backend-laravel/app/Models/${FILE_NAME}.php"
            "$BACKUP_DIR/backend-laravel/app/Model/${FILE_NAME}.php"
            "$BACKUP_DIR/backend-laravel/${FILE_NAME}.php"
            "$BACKUP_DIR/${FILE_NAME}.php"
        )
        TARGET_DIR="$BACKEND_DIR/app/Models"
        ;;
    migration)
        SEARCH_PATHS=(
            "$BACKUP_DIR/backend-laravel/database/migrations/*${FILE_NAME}*.php"
            "$BACKUP_DIR/backend-laravel/${FILE_NAME}.php"
            "$BACKUP_DIR/${FILE_NAME}.php"
        )
        TARGET_DIR="$BACKEND_DIR/database/migrations"
        ;;
    service)
        SEARCH_PATHS=(
            "$BACKUP_DIR/backend-laravel/app/Services/${FILE_NAME}.php"
            "$BACKUP_DIR/backend-laravel/${FILE_NAME}.php"
            "$BACKUP_DIR/${FILE_NAME}.php"
        )
        TARGET_DIR="$BACKEND_DIR/app/Services"
        ;;
    *)
        echo "❌ Tipo inválido: $TYPE"
        echo "   Tipos válidos: controller, model, migration, service"
        exit 1
        ;;
esac

# Procurar no backup
FOUND_FILE=""
for path in "${SEARCH_PATHS[@]}"; do
    # Expandir glob patterns
    for file in $path; do
        if [ -f "$file" ]; then
            FOUND_FILE="$file"
            break 2
        fi
    done
done

if [ -n "$FOUND_FILE" ]; then
    echo "✅ Arquivo encontrado no backup:"
    echo "   $FOUND_FILE"
    echo ""
    
    # Mostrar informações do arquivo
    echo "📋 Informações:"
    ls -lh "$FOUND_FILE" | awk '{print "   Tamanho: " $5 " | Modificado: " $6 " " $7 " " $8}'
    echo ""
    
    # Mostrar primeiras linhas
    echo "📄 Primeiras linhas:"
    head -10 "$FOUND_FILE" | sed 's/^/   /'
    echo ""
    
    read -p "Deseja copiar este arquivo para $TARGET_DIR/? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        mkdir -p "$TARGET_DIR"
        
        # Determinar nome do arquivo de destino
        if [ "$TYPE" = "migration" ]; then
            # Para migrations, manter o nome completo
            DEST_FILE="$TARGET_DIR/$(basename "$FOUND_FILE")"
        else
            DEST_FILE="$TARGET_DIR/${FILE_NAME}.php"
        fi
        
        cp "$FOUND_FILE" "$DEST_FILE"
        echo "✅ Arquivo copiado para: $DEST_FILE"
        
        # Verificar se precisa ajustar namespace
        if grep -q "namespace App" "$DEST_FILE"; then
            echo "✅ Namespace parece correto"
        else
            echo "⚠️  Verifique o namespace do arquivo"
        fi
    else
        echo "❌ Operação cancelada"
    fi
else
    echo "❌ Arquivo NÃO encontrado no backup"
    echo ""
    echo "📁 Locais verificados:"
    for path in "${SEARCH_PATHS[@]}"; do
        echo "   - $path"
    done
    echo ""
    echo "💡 Próximos passos:"
    echo "   1. Verificar se o arquivo existe em outro local"
    echo "   2. Verificar se o nome está correto"
    echo "   3. Criar o arquivo manualmente se necessário"
fi

echo ""
echo "=========================================="

