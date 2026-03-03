#!/bin/bash

# Script para sincronizar controllers, models, migrations e rotas do backup

set -e

BACKUP_DIR="/tmp/lacos/backend-laravel"
PROJECT_DIR="/home/darley/lacos/backend-laravel"
BACKUP_SOURCE="/home/darley/lacos_backups"

echo "=========================================="
echo "🔄 SINCRONIZANDO BACKUP COMPLETO"
echo "=========================================="
echo ""

# Extrair backup se necessário
if [ ! -d "$BACKUP_DIR" ]; then
    echo "📦 Extraindo backup..."
    cd /tmp
    rm -rf lacos 2>/dev/null
    tar -xzf "$BACKUP_SOURCE"/*.tar.gz 2>/dev/null
    echo "✅ Backup extraído"
    echo ""
fi

# Contadores
COPIED_CONTROLLERS=0
COPIED_MODELS=0
COPIED_MIGRATIONS=0
UPDATED_ROUTES=0

# ==================== CONTROLLERS ====================
echo "📁 Verificando Controllers..."
echo ""

BACKUP_CONTROLLERS=$(find "$BACKUP_DIR/app/Http/Controllers/Api" -name "*.php" -type f 2>/dev/null | sort)
PROJECT_CONTROLLERS=$(find "$PROJECT_DIR/app/Http/Controllers/Api" -name "*.php" -type f 2>/dev/null | sort)

for backup_file in $BACKUP_CONTROLLERS; do
    filename=$(basename "$backup_file")
    project_file="$PROJECT_DIR/app/Http/Controllers/Api/$filename"
    
    if [ ! -f "$project_file" ]; then
        echo "   ✅ Copiando: $filename"
        cp "$backup_file" "$project_file"
        COPIED_CONTROLLERS=$((COPIED_CONTROLLERS + 1))
    else
        echo "   ⏭️  Já existe: $filename"
    fi
done

echo ""

# ==================== MODELS ====================
echo "📁 Verificando Models..."
echo ""

# Criar diretório Models se não existir
mkdir -p "$PROJECT_DIR/app/Models"

BACKUP_MODELS=$(find "$BACKUP_DIR/app/Models" -name "*.php" -type f 2>/dev/null | sort)
PROJECT_MODELS=$(find "$PROJECT_DIR/app/Models" -name "*.php" -type f 2>/dev/null | sort)

for backup_file in $BACKUP_MODELS; do
    filename=$(basename "$backup_file")
    project_file="$PROJECT_DIR/app/Models/$filename"
    
    if [ ! -f "$project_file" ]; then
        echo "   ✅ Copiando: $filename"
        cp "$backup_file" "$project_file"
        COPIED_MODELS=$((COPIED_MODELS + 1))
    else
        echo "   ⏭️  Já existe: $filename"
    fi
done

echo ""

# ==================== MIGRATIONS ====================
echo "📁 Verificando Migrations..."
echo ""

# Criar diretório migrations se não existir
mkdir -p "$PROJECT_DIR/database/migrations"

BACKUP_MIGRATIONS=$(find "$BACKUP_DIR/database/migrations" -name "*.php" -type f 2>/dev/null | sort)
PROJECT_MIGRATIONS=$(find "$PROJECT_DIR/database/migrations" -name "*.php" -type f 2>/dev/null | sort)

for backup_file in $BACKUP_MIGRATIONS; do
    filename=$(basename "$backup_file")
    project_file="$PROJECT_DIR/database/migrations/$filename"
    
    if [ ! -f "$project_file" ]; then
        echo "   ✅ Copiando: $filename"
        cp "$backup_file" "$project_file"
        COPIED_MIGRATIONS=$((COPIED_MIGRATIONS + 1))
    else
        echo "   ⏭️  Já existe: $filename"
    fi
done

echo ""

# ==================== SERVICES ====================
echo "📁 Verificando Services..."
echo ""

# Criar diretório Services se não existir
mkdir -p "$PROJECT_DIR/app/Services"

if [ -d "$BACKUP_DIR/app/Services" ]; then
    BACKUP_SERVICES=$(find "$BACKUP_DIR/app/Services" -name "*.php" -type f 2>/dev/null | sort)
    
    for backup_file in $BACKUP_SERVICES; do
        filename=$(basename "$backup_file")
        project_file="$PROJECT_DIR/app/Services/$filename"
        
        if [ ! -f "$project_file" ]; then
            echo "   ✅ Copiando: $filename"
            cp "$backup_file" "$project_file"
        else
            echo "   ⏭️  Já existe: $filename"
        fi
    done
fi

echo ""

# ==================== ROTAS ====================
echo "📁 Atualizando Rotas (routes/api.php)..."
echo ""

if [ -f "$BACKUP_DIR/routes/api.php" ]; then
    # Fazer backup do arquivo atual
    cp "$PROJECT_DIR/routes/api.php" "$PROJECT_DIR/routes/api.php.backup_antes_sync_$(date +%Y%m%d_%H%M%S)"
    
    # Copiar rotas do backup
    cp "$BACKUP_DIR/routes/api.php" "$PROJECT_DIR/routes/api.php"
    echo "   ✅ Rotas atualizadas do backup"
    UPDATED_ROUTES=1
else
    echo "   ⚠️  Arquivo de rotas não encontrado no backup"
fi

echo ""

# ==================== RESUMO ====================
echo "=========================================="
echo "✅ SINCRONIZAÇÃO CONCLUÍDA!"
echo "=========================================="
echo ""
echo "📊 Resumo:"
echo "   Controllers copiados: $COPIED_CONTROLLERS"
echo "   Models copiados: $COPIED_MODELS"
echo "   Migrations copiadas: $COPIED_MIGRATIONS"
if [ $UPDATED_ROUTES -eq 1 ]; then
    echo "   Rotas: ✅ Atualizadas"
else
    echo "   Rotas: ⏭️  Não atualizadas"
fi
echo ""
echo "🔍 Verificando se há controllers faltando nas rotas..."
echo ""

# Verificar controllers referenciados nas rotas mas não existentes
if [ -f "$PROJECT_DIR/routes/api.php" ]; then
    ROUTE_CONTROLLERS=$(grep -oP 'App\\Http\\Controllers\\Api\\\K\w+' "$PROJECT_DIR/routes/api.php" | sort -u)
    
    for controller in $ROUTE_CONTROLLERS; do
        controller_file="$PROJECT_DIR/app/Http/Controllers/Api/${controller}.php"
        if [ ! -f "$controller_file" ]; then
            echo "   ⚠️  Controller faltando: $controller"
        fi
    done
fi

echo ""
echo "🚀 Próximos passos:"
echo "   1. Verificar se todos os controllers existem"
echo "   2. Executar: php artisan route:list"
echo "   3. Executar migrations se necessário: php artisan migrate"
echo ""












