#!/bin/bash

# Script para verificar e corrigir as migrations
# Execute no servidor como root

cd /var/www/lacos-backend

echo "🔍 Verificando se as tabelas já existem..."

# Verificar se a tabela plans existe
php artisan tinker --execute="
try {
    \$count = DB::table('plans')->count();
    echo 'Tabela plans existe com ' . \$count . ' registros';
} catch (\Exception \$e) {
    echo 'Tabela plans NÃO existe: ' . \$e->getMessage();
}
"

echo ""
echo "📋 Verificando arquivos de migration..."
ls -la create_plans_table.php create_user_plans_table.php 2>/dev/null || echo "Arquivos não encontrados na raiz"

echo ""
echo "📁 Verificando migrations padrão do Laravel..."
ls -la database/migrations/ | tail -5

echo ""
echo "💡 Se as tabelas não existem, precisamos mover os arquivos para database/migrations/"
echo "   ou executar as migrations de outra forma"

