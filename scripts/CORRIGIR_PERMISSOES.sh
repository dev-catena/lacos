#!/bin/bash

# Script para corrigir permissões do Laravel
# Execute no servidor

set -e

cd /var/www/lacos-backend

echo "🔧 Corrigindo permissões do Laravel..."
echo ""

# Corrigir permissões do storage
echo "1️⃣ Corrigindo permissões do storage..."
sudo chown -R www-data:www-data storage
sudo chmod -R 775 storage
echo "✅ Storage corrigido"
echo ""

# Corrigir permissões do bootstrap/cache
echo "2️⃣ Corrigindo permissões do bootstrap/cache..."
sudo chown -R www-data:www-data bootstrap/cache
sudo chmod -R 775 bootstrap/cache
echo "✅ Bootstrap/cache corrigido"
echo ""

# Criar arquivo de log se não existir
echo "3️⃣ Verificando arquivo de log..."
if [ ! -f storage/logs/laravel.log ]; then
    sudo touch storage/logs/laravel.log
    sudo chown www-data:www-data storage/logs/laravel.log
    sudo chmod 664 storage/logs/laravel.log
    echo "✅ Arquivo de log criado"
else
    sudo chown www-data:www-data storage/logs/laravel.log
    sudo chmod 664 storage/logs/laravel.log
    echo "✅ Permissões do log corrigidas"
fi
echo ""

# Verificar estrutura de diretórios
echo "4️⃣ Verificando estrutura de diretórios..."
for dir in storage/app storage/framework storage/framework/cache storage/framework/sessions storage/framework/views storage/logs; do
    if [ ! -d "$dir" ]; then
        sudo mkdir -p "$dir"
        echo "   Criado: $dir"
    fi
done
sudo chown -R www-data:www-data storage
sudo chmod -R 775 storage
echo "✅ Estrutura verificada"
echo ""

echo "=========================================="
echo "✅ Permissões corrigidas com sucesso!"
echo "=========================================="
echo ""
echo "🧪 Teste agora:"
echo "   php artisan config:clear"
echo "   php artisan tinker"
echo ""

