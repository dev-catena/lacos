#!/bin/bash

# Script para executar as migrations corretamente
# Execute no servidor como root

cd /var/www/lacos-backend

echo "🔍 Verificando se as tabelas já existem..."

# Verificar se a tabela plans existe
php artisan tinker --execute="
try {
    \$count = DB::table('plans')->count();
    echo '✅ Tabela plans já existe com ' . \$count . ' registros';
    exit(0);
} catch (\Exception \$e) {
    echo '❌ Tabela plans NÃO existe';
    exit(1);
}
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ As tabelas já existem! Não é necessário executar migrations."
    echo ""
    echo "📋 Verificando planos existentes:"
    php artisan tinker --execute="
    \$plans = DB::table('plans')->get();
    foreach (\$plans as \$plan) {
        echo '  - ' . \$plan->name . ' (ID: ' . \$plan->id . ', Padrão: ' . (\$plan->is_default ? 'Sim' : 'Não') . ')';
    }
    "
    exit 0
fi

echo ""
echo "📦 As tabelas não existem. Executando migrations..."

# Opção 1: Mover para database/migrations e executar normalmente
if [ -f "create_plans_table.php" ] && [ -f "create_user_plans_table.php" ]; then
    echo "📁 Movendo migrations para database/migrations/..."
    
    # Criar timestamp para os nomes das migrations
    TIMESTAMP1=$(date +%Y_%m_%d_%H%M%S)
    TIMESTAMP2=$(date +%Y_%m_%d_%H%M%S -d "+1 second")
    
    mv create_plans_table.php database/migrations/${TIMESTAMP1}_create_plans_table.php
    mv create_user_plans_table.php database/migrations/${TIMESTAMP2}_create_user_plans_table.php
    
    echo "✅ Migrations movidas"
    echo ""
    echo "🚀 Executando migrations..."
    php artisan migrate
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Migrations executadas com sucesso!"
        echo ""
        echo "📋 Verificando planos criados:"
        php artisan tinker --execute="
        \$plans = DB::table('plans')->get();
        foreach (\$plans as \$plan) {
            echo '  - ' . \$plan->name . ' (ID: ' . \$plan->id . ', Padrão: ' . (\$plan->is_default ? 'Sim' : 'Não') . ')';
        }
        "
    else
        echo "❌ Erro ao executar migrations"
        exit 1
    fi
else
    echo "❌ Arquivos de migration não encontrados!"
    echo "   Verifique se create_plans_table.php e create_user_plans_table.php existem"
    exit 1
fi

