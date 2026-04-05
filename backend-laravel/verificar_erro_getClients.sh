#!/bin/bash

echo "🔍 Verificando erro no método getClients..."
echo ""

cd /var/www/lacos-backend || exit 1

# 1. Verificar logs recentes
echo "📋 Últimas linhas do log do Laravel (erros relacionados a getClients):"
echo "=========================================="
tail -100 storage/logs/laravel.log | grep -A 20 -B 5 "getClients\|CaregiverController\|Error\|Exception" | tail -50
echo "=========================================="
echo ""

# 2. Verificar se o método está correto
echo "📝 Verificando método getClients no controller:"
echo "=========================================="
grep -A 5 "public function getClients" app/Http/Controllers/Api/CaregiverController.php | head -10
echo "=========================================="
echo ""

# 3. Verificar imports
echo "📝 Verificando imports necessários:"
echo "=========================================="
grep -E "use Illuminate\\Support\\Facades\\(DB|Log|Auth);" app/Http/Controllers/Api/CaregiverController.php
echo "=========================================="
echo ""

# 4. Verificar se tabela group_members existe
echo "📝 Verificando se tabela group_members existe:"
echo "=========================================="
php artisan tinker --execute="echo Schema::hasTable('group_members') ? '✅ Tabela group_members existe' : '❌ Tabela group_members NÃO existe';" 2>/dev/null || echo "⚠️ Não foi possível verificar (tinker pode não estar disponível)"
echo "=========================================="
echo ""

# 5. Testar sintaxe PHP
echo "🔍 Verificando sintaxe PHP:"
php -l app/Http/Controllers/Api/CaregiverController.php
echo ""

# 6. Verificar permissões
echo "📝 Verificando permissões do arquivo:"
ls -la app/Http/Controllers/Api/CaregiverController.php
echo ""

echo "💡 Se ainda houver erro, execute:"
echo "   tail -f storage/logs/laravel.log"
echo "   E então teste o endpoint no app para ver o erro em tempo real"


