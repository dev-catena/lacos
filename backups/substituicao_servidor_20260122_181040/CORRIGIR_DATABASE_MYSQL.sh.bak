#!/bin/bash

# Script para corrigir configuração do banco de dados para MySQL
# Execute no servidor

set -e

cd /var/www/lacos-backend

echo "🔧 Corrigindo configuração do banco de dados..."
echo ""

# Verificar .env
echo "1️⃣ Verificando .env..."
if grep -q "^DB_CONNECTION=mysql" .env; then
    echo "✅ DB_CONNECTION=mysql encontrado no .env"
else
    echo "⚠️  DB_CONNECTION não está definido como mysql no .env"
    echo "   Adicionando DB_CONNECTION=mysql..."
    sudo sed -i '/^DB_CONNECTION=/d' .env
    sudo sed -i '/^# Database/a DB_CONNECTION=mysql' .env
fi
echo ""

# Corrigir config/database.php
echo "2️⃣ Corrigindo config/database.php..."
if grep -q "'default' => env('DB_CONNECTION', 'sqlite')" config/database.php; then
    sudo sed -i "s/'default' => env('DB_CONNECTION', 'sqlite'),/'default' => env('DB_CONNECTION', 'mysql'),/" config/database.php
    echo "✅ Padrão alterado de sqlite para mysql"
else
    echo "ℹ️  Configuração já está correta ou diferente"
fi
echo ""

# Limpar cache
echo "3️⃣ Limpando cache..."
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true
echo "✅ Cache limpo"
echo ""

# Verificar configuração
echo "4️⃣ Verificando configuração..."
DB_DEFAULT=$(php artisan config:show database.default 2>/dev/null | tail -1 | xargs)
echo "   Database default: $DB_DEFAULT"
if [ "$DB_DEFAULT" = "mysql" ]; then
    echo "✅ Configuração correta!"
else
    echo "⚠️  Ainda está usando: $DB_DEFAULT"
fi
echo ""

# Testar conexão
echo "5️⃣ Testando conexão com MySQL..."
php artisan tinker --execute="
try {
    DB::connection()->getPdo();
    echo '✅ Conexão com MySQL OK\n';
} catch (Exception \$e) {
    echo '❌ Erro na conexão: ' . \$e->getMessage() . '\n';
}
" 2>&1 | grep -E "✅|❌|Erro" || echo "⚠️  Não foi possível testar conexão"
echo ""

echo "=========================================="
echo "✅ Configuração corrigida!"
echo "=========================================="
echo ""

