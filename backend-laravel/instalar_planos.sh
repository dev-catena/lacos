#!/bin/bash

# Script para instalar sistema de planos no servidor
# Execute como root no servidor

set -e

cd /var/www/lacos-backend

echo "🚀 Instalando sistema de planos..."

# Verificar se as tabelas já existem
echo "🔍 Verificando se as tabelas já existem..."
TABLE_EXISTS=$(php artisan tinker --execute="
try {
    \$count = DB::table('plans')->count();
    echo 'EXISTS:' . \$count;
} catch (\Exception \$e) {
    echo 'NOT_EXISTS';
}
" 2>/dev/null | grep -o "EXISTS:" || echo "NOT_EXISTS")

if echo "$TABLE_EXISTS" | grep -q "EXISTS:"; then
    COUNT=$(echo "$TABLE_EXISTS" | grep -o "[0-9]*")
    echo ""
    echo "✅ Tabela plans já existe com $COUNT registros!"
    echo ""
    echo "📋 Planos existentes:"
    php artisan tinker --execute="
    \$plans = DB::table('plans')->get();
    foreach (\$plans as \$plan) {
        echo '  - ' . \$plan->name . ' (ID: ' . \$plan->id . ', Padrão: ' . (\$plan->is_default ? 'Sim' : 'Não') . ')';
    }
    " 2>/dev/null
    echo ""
    echo "✅ Sistema de planos já está instalado e funcionando!"
    exit 0
fi

echo ""
echo "📦 Criando migrations..."

# Verificar se os arquivos existem na raiz
if [ ! -f "create_plans_table.php" ] || [ ! -f "create_user_plans_table.php" ]; then
    echo "❌ Arquivos de migration não encontrados na raiz!"
    echo "   Procurando em database/migrations/..."
    
    PLAN_FILE=$(find database/migrations -name "*_create_plans_table.php" 2>/dev/null | head -1)
    USER_PLAN_FILE=$(find database/migrations -name "*_create_user_plans_table.php" 2>/dev/null | head -1)
    
    if [ -z "$PLAN_FILE" ] || [ -z "$USER_PLAN_FILE" ]; then
        echo "❌ Arquivos de migration não encontrados!"
        echo "   Execute o script de criação de arquivos primeiro."
        exit 1
    fi
    
    echo "✅ Arquivos encontrados em database/migrations/"
    echo "   Executando migrations..."
    
    php artisan migrate --path=$PLAN_FILE
    php artisan migrate --path=$USER_PLAN_FILE
    
else
    echo "✅ Arquivos encontrados na raiz. Movendo para database/migrations/..."
    
    # Criar timestamps
    TIMESTAMP1=$(date +%Y_%m_%d_%H%M%S)
    sleep 1
    TIMESTAMP2=$(date +%Y_%m_%d_%H%M%S)
    
    # Mover para o diretório correto
    mv create_plans_table.php database/migrations/${TIMESTAMP1}_create_plans_table.php
    mv create_user_plans_table.php database/migrations/${TIMESTAMP2}_create_user_plans_table.php
    
    echo "✅ Migrations movidas"
    echo ""
    echo "🚀 Executando migrations..."
    
    php artisan migrate --path=database/migrations/${TIMESTAMP1}_create_plans_table.php
    php artisan migrate --path=database/migrations/${TIMESTAMP2}_create_user_plans_table.php
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations executadas com sucesso!"
    echo ""
    echo "📋 Verificando planos criados:"
    php artisan tinker --execute="
    \$plans = DB::table('plans')->get();
    foreach (\$plans as \$plan) {
        echo '  ✅ ' . \$plan->name . ' (ID: ' . \$plan->id . ', Padrão: ' . (\$plan->is_default ? 'Sim' : 'Não') . ')';
    }
    "
    
    echo ""
    echo "📊 Verificando usuários com planos:"
    php artisan tinker --execute="
    \$userPlans = DB::table('user_plans')->where('is_active', true)->count();
    echo '  ✅ ' . \$userPlans . ' usuários com planos ativos';
    "
    
    echo ""
    echo "🎉 Sistema de planos instalado com sucesso!"
    echo ""
    echo "📝 Próximos passos:"
    echo "   1. Verificar se o PlanController.php está em app/Http/Controllers/Api/"
    echo "   2. Verificar se o Plan.php está em app/Models/"
    echo "   3. Adicionar rotas no arquivo de rotas da API"
    echo "   4. Testar a API: GET /api/plans"
else
    echo ""
    echo "❌ Erro ao executar migrations"
    exit 1
fi

