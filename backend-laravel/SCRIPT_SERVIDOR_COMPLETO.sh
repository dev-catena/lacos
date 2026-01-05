#!/bin/bash

echo "🔍 Verificando e corrigindo erro no getClients..."
echo ""

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

# 1. Verificar logs primeiro
echo "📋 ÚLTIMOS ERROS NO LOG:"
echo "=========================================="
tail -50 storage/logs/laravel.log | grep -A 10 "getClients\|CaregiverController\|Error\|Exception" | tail -30
echo "=========================================="
echo ""

# 2. Fazer backup
echo "📦 Criando backup..."
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup: $BACKUP_FILE"
echo ""

# 3. Verificar se método existe
if ! grep -q "public function getClients" "$CONTROLLER_FILE"; then
    echo "❌ Método getClients NÃO encontrado!"
    exit 1
fi

echo "✅ Método getClients encontrado"
echo ""

# 4. Verificar imports
echo "📝 Verificando imports..."
HAS_DB=$(grep -q "use Illuminate\\Support\\Facades\\DB;" "$CONTROLLER_FILE" && echo "sim" || echo "não")
HAS_LOG=$(grep -q "use Illuminate\\Support\\Facades\\Log;" "$CONTROLLER_FILE" && echo "sim" || echo "não")
HAS_SCHEMA=$(grep -q "use Illuminate\\Support\\Facades\\Schema;" "$CONTROLLER_FILE" && echo "sim" || echo "não")

echo "   - Use DB: $HAS_DB"
echo "   - Use Log: $HAS_LOG"
echo "   - Use Schema: $HAS_SCHEMA"
echo ""

# Adicionar imports faltantes
if [ "$HAS_DB" = "não" ]; then
    echo "📝 Adicionando use DB..."
    sudo sed -i "/^use Illuminate\\Support\\Facades\\Auth;/a use Illuminate\\Support\\Facades\\DB;" "$CONTROLLER_FILE"
    echo "✅ Use DB adicionado"
fi

if [ "$HAS_LOG" = "não" ]; then
    echo "📝 Adicionando use Log..."
    sudo sed -i "/^use Illuminate\\Support\\Facades\\DB;/a use Illuminate\\Support\\Facades\\Log;" "$CONTROLLER_FILE"
    echo "✅ Use Log adicionado"
fi

if [ "$HAS_SCHEMA" = "não" ]; then
    echo "📝 Adicionando use Schema..."
    sudo sed -i "/^use Illuminate\\Support\\Facades\\Log;/a use Illuminate\\Support\\Facades\\Schema;" "$CONTROLLER_FILE"
    echo "✅ Use Schema adicionado"
fi
echo ""

# 5. Verificar sintaxe
echo "🔍 Verificando sintaxe PHP..."
if php -l "$CONTROLLER_FILE" > /dev/null 2>&1; then
    echo "✅ Sintaxe PHP válida"
else
    echo "❌ Erro de sintaxe:"
    php -l "$CONTROLLER_FILE"
    echo ""
    echo "🔄 Restaurando backup..."
    sudo cp "$BACKUP_FILE" "$CONTROLLER_FILE"
    exit 1
fi
echo ""

# 6. Verificar se tabela group_members existe
echo "📝 Verificando tabela group_members..."
php artisan tinker --execute="echo Schema::hasTable('group_members') ? '✅ Tabela existe' : '❌ Tabela NÃO existe';" 2>/dev/null || echo "⚠️ Não foi possível verificar (execute: php artisan tinker)"
echo ""

# 7. Limpar cache
echo "🧹 Limpando cache..."
php artisan route:clear > /dev/null 2>&1
php artisan config:clear > /dev/null 2>&1
php artisan cache:clear > /dev/null 2>&1
echo "✅ Cache limpo"
echo ""

# 8. Mostrar método atual
echo "📝 Método getClients (primeiras 20 linhas):"
echo "=========================================="
grep -A 20 "public function getClients" "$CONTROLLER_FILE" | head -25
echo "=========================================="
echo ""

echo "✅ Verificação concluída!"
echo ""
echo "💡 PRÓXIMOS PASSOS:"
echo "   1. Teste o endpoint no app novamente"
echo "   2. Se ainda houver erro, veja os logs em tempo real:"
echo "      tail -f storage/logs/laravel.log"
echo "   3. Ou veja os últimos erros:"
echo "      tail -100 storage/logs/laravel.log | grep -A 15 getClients"


