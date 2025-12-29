#!/bin/bash

echo "🔍 Verificando imports finais no CaregiverController..."
echo ""

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"

echo "📝 TODOS os imports no arquivo:"
echo "=========================================="
grep "^use " "$CONTROLLER_FILE"
echo "=========================================="
echo ""

echo "📝 Verificando imports específicos:"
echo "   - Auth: $(grep -q "use Illuminate\\Support\\Facades\\Auth;" "$CONTROLLER_FILE" && echo "✅ ENCONTRADO" || echo "❌ NÃO ENCONTRADO")"
echo "   - DB: $(grep -q "use Illuminate\\Support\\Facades\\DB;" "$CONTROLLER_FILE" && echo "✅ ENCONTRADO" || echo "❌ NÃO ENCONTRADO")"
echo "   - Log: $(grep -q "use Illuminate\\Support\\Facades\\Log;" "$CONTROLLER_FILE" && echo "✅ ENCONTRADO" || echo "❌ NÃO ENCONTRADO")"
echo ""

# Se não encontrou, adicionar manualmente
if ! grep -q "use Illuminate\\Support\\Facades\\Auth;" "$CONTROLLER_FILE"; then
    echo "📝 Adicionando use Auth manualmente..."
    # Encontrar linha do DB e adicionar após
    DB_LINE=$(grep -n "use Illuminate\\Support\\Facades\\DB;" "$CONTROLLER_FILE" | head -1 | cut -d: -f1)
    if [ -n "$DB_LINE" ]; then
        sudo sed -i "${DB_LINE}a use Illuminate\\Support\\Facades\\Auth;" "$CONTROLLER_FILE"
        echo "✅ Use Auth adicionado na linha $((DB_LINE + 1))"
    fi
fi

if ! grep -q "use Illuminate\\Support\\Facades\\Log;" "$CONTROLLER_FILE"; then
    echo "📝 Adicionando use Log manualmente..."
    # Encontrar linha do Auth (ou DB se Auth não existe) e adicionar após
    AUTH_LINE=$(grep -n "use Illuminate\\Support\\Facades\\Auth;" "$CONTROLLER_FILE" | head -1 | cut -d: -f1)
    if [ -n "$AUTH_LINE" ]; then
        sudo sed -i "${AUTH_LINE}a use Illuminate\\Support\\Facades\\Log;" "$CONTROLLER_FILE"
        echo "✅ Use Log adicionado na linha $((AUTH_LINE + 1))"
    else
        DB_LINE=$(grep -n "use Illuminate\\Support\\Facades\\DB;" "$CONTROLLER_FILE" | head -1 | cut -d: -f1)
        if [ -n "$DB_LINE" ]; then
            sudo sed -i "${DB_LINE}a use Illuminate\\Support\\Facades\\Log;" "$CONTROLLER_FILE"
            echo "✅ Use Log adicionado na linha $((DB_LINE + 1))"
        fi
    fi
fi

echo ""
echo "📝 Imports após correção final:"
echo "=========================================="
grep "^use " "$CONTROLLER_FILE"
echo "=========================================="
echo ""

# Verificar sintaxe
echo "🔍 Verificando sintaxe PHP..."
if php -l "$CONTROLLER_FILE" > /dev/null 2>&1; then
    echo "✅ Sintaxe PHP válida"
else
    echo "❌ Erro de sintaxe:"
    php -l "$CONTROLLER_FILE"
    exit 1
fi

# Limpar cache
echo ""
echo "🧹 Limpando cache..."
php artisan route:clear > /dev/null 2>&1
php artisan config:clear > /dev/null 2>&1
php artisan cache:clear > /dev/null 2>&1
echo "✅ Cache limpo"
echo ""

echo "✅ Verificação final concluída!"


