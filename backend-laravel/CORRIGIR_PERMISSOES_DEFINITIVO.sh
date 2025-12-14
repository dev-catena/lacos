#!/bin/bash

# Script para corrigir permissões do Laravel de forma definitiva
# Execute no servidor

set -e

cd /var/www/lacos-backend

echo "🔧 Corrigindo permissões do Laravel (definitivo)..."
echo ""

# Remover arquivo de log antigo se existir
echo "1️⃣ Removendo log antigo..."
sudo rm -f storage/logs/laravel.log 2>/dev/null || true
echo "✅ Log antigo removido"
echo ""

# Criar estrutura de diretórios
echo "2️⃣ Criando estrutura de diretórios..."
sudo mkdir -p storage/app/public
sudo mkdir -p storage/framework/cache
sudo mkdir -p storage/framework/sessions
sudo mkdir -p storage/framework/views
sudo mkdir -p storage/logs
sudo mkdir -p bootstrap/cache
echo "✅ Estrutura criada"
echo ""

# Corrigir permissões do storage (permissivo temporariamente)
echo "3️⃣ Corrigindo permissões do storage..."
sudo chown -R www-data:www-data storage
sudo chmod -R 777 storage
echo "✅ Storage com permissões 777 (temporário)"
echo ""

# Corrigir permissões do bootstrap/cache
echo "4️⃣ Corrigindo permissões do bootstrap/cache..."
sudo chown -R www-data:www-data bootstrap/cache
sudo chmod -R 777 bootstrap/cache
echo "✅ Bootstrap/cache corrigido"
echo ""

# Criar arquivo de log com permissões corretas
echo "5️⃣ Criando arquivo de log..."
sudo touch storage/logs/laravel.log
sudo chown www-data:www-data storage/logs/laravel.log
sudo chmod 666 storage/logs/laravel.log
echo "✅ Arquivo de log criado"
echo ""

# Testar se consegue escrever
echo "6️⃣ Testando escrita no log..."
sudo -u www-data php -r "file_put_contents('storage/logs/test.log', 'test'); unlink('storage/logs/test.log');" 2>/dev/null && echo "✅ Teste de escrita OK" || echo "⚠️  Ainda há problemas de permissão"
echo ""

# Limpar cache
echo "7️⃣ Limpando cache..."
sudo -u www-data php artisan config:clear 2>/dev/null || php artisan config:clear
sudo -u www-data php artisan cache:clear 2>/dev/null || php artisan cache:clear
echo "✅ Cache limpo"
echo ""

echo "=========================================="
echo "✅ Permissões corrigidas!"
echo "=========================================="
echo ""
echo "📝 Nota: Permissões 777 foram usadas temporariamente"
echo "   Para produção, considere usar 775 após testar"
echo ""
echo "🧪 Teste agora:"
echo "   php artisan tinker"
echo ""

