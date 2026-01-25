#!/bin/bash

# Script para verificar status das migrations e executar as pendentes
# Usa usuário lacos (não mexe no .env)

echo "🔍 Verificando status das migrations..."

# Encontrar diretório do backend
POSSIBLE_PATHS=(
    "/var/www/lacos-backend"
    "/home/darley/lacos-backend"
    "/home/darley/lacos/backend-laravel"
    "$(pwd)"
)

BACKEND_PATH=""

for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -d "$path" ] && [ -f "$path/artisan" ]; then
        BACKEND_PATH="$path"
        break
    fi
done

if [ -z "$BACKEND_PATH" ]; then
    echo "❌ Backend Laravel não encontrado!"
    exit 1
fi

cd "$BACKEND_PATH" || exit 1

echo "📁 Diretório: $(pwd)"
echo ""

# Verificar status das migrations
echo "📊 Status das migrations:"
php artisan migrate:status

echo ""
echo "🔍 Verificando migrations pendentes..."

# Verificar se há migrations pendentes
PENDING=$(php artisan migrate:status 2>/dev/null | grep -c "Pending" || echo "0")

if [ "$PENDING" -gt 0 ]; then
    echo "⚠️  Encontradas $PENDING migration(s) pendente(s)"
    echo ""
    echo "🚀 Executando migrations pendentes..."
    echo ""
    
    # Corrigir permissões antes de executar
    if [ -d "storage" ]; then
        sudo chmod -R 775 storage bootstrap/cache 2>/dev/null || chmod -R 775 storage bootstrap/cache
        sudo chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
    fi
    
    # Executar migrations
    php artisan migrate --force
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Migrations executadas com sucesso!"
        echo ""
        echo "📊 Status final:"
        php artisan migrate:status | grep -E "(Ran|Pending)"
    else
        echo ""
        echo "❌ Erro ao executar migrations!"
        exit 1
    fi
else
    echo "✅ Todas as migrations já foram executadas!"
    echo ""
    echo "📊 Tabelas no banco:"
    mysql -u lacos -p'Lacos2025Secure' lacos -e "SHOW TABLES;" 2>/dev/null | grep -E "(supplier_products|orders|order_items|conversations|messages)" || echo "   (Tabelas novas não encontradas - pode ser que as migrations ainda não tenham sido criadas)"
fi

echo ""
echo "✨ Verificação concluída!"




