#!/bin/bash

# Script para corrigir permissões e limpar cache do Laravel
# O .env está correto, mas o Laravel pode estar usando cache antigo

echo "🔧 Corrigindo permissões e limpando cache..."

cd /var/www/lacos-backend || exit 1

echo "📁 Diretório: $(pwd)"
echo ""

# 1. Corrigir permissões do storage
echo "🔧 1. Corrigindo permissões do storage..."
sudo chmod -R 775 storage bootstrap/cache
sudo chown -R www-data:www-data storage bootstrap/cache

# Criar/ajustar arquivo de log
if [ ! -f "storage/logs/laravel.log" ]; then
    sudo touch storage/logs/laravel.log
fi
sudo chmod 664 storage/logs/laravel.log
sudo chown www-data:www-data storage/logs/laravel.log

echo "✅ Permissões corrigidas"
echo ""

# 2. Limpar cache do Laravel
echo "🧹 2. Limpando cache do Laravel..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

echo "✅ Cache limpo"
echo ""

# 3. Verificar configuração atual
echo "🔍 3. Verificando configuração do banco (após limpar cache)..."
php artisan tinker --execute="echo 'DB: ' . config('database.connections.mysql.database') . PHP_EOL; echo 'User: ' . config('database.connections.mysql.username') . PHP_EOL;" 2>/dev/null || {
    echo "   (Não foi possível verificar via tinker, mas o cache foi limpo)"
}

echo ""
echo "🚀 4. Executando migrations..."
echo ""

# Executar migrations
php artisan migrate --force

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations executadas com sucesso!"
    echo ""
    echo "📊 Verificando novas tabelas..."
    mysql -u lacos -p'Lacos2025Secure' lacos -e "SHOW TABLES;" 2>/dev/null | grep -E "(supplier_products|orders|order_items|conversations|messages)" && echo "✅ Novas tabelas encontradas!" || echo "⚠️  Algumas tabelas podem não ter sido criadas"
else
    echo ""
    echo "❌ Erro ao executar migrations!"
    echo ""
    echo "💡 Se ainda houver erro, verifique:"
    echo "   1. Se o arquivo .env está correto (DB_USERNAME=lacos, DB_DATABASE=lacos)"
    echo "   2. Se o usuário 'lacos' tem permissão no banco 'lacos'"
    exit 1
fi

echo ""
echo "✨ Processo concluído!"




