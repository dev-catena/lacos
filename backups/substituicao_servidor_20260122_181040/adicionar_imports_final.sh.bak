#!/bin/bash

echo "🔧 Adicionando imports Auth e Log..."
echo ""

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"

# A linha 11 tem o DB, vamos adicionar após ela
DB_LINE=11

echo "📝 Adicionando imports após linha $DB_LINE (DB)..."
echo ""

# Verificar se Auth já existe
if grep -q "Facades.*Auth" "$CONTROLLER_FILE"; then
    echo "✅ Use Auth já existe"
else
    echo "📝 Adicionando use Auth..."
    sudo sed -i "${DB_LINE}a\\use Illuminate\\Support\\Facades\\Auth;" "$CONTROLLER_FILE"
    echo "✅ Use Auth adicionado"
fi

# Verificar se Log já existe
if grep -q "Facades.*Log" "$CONTROLLER_FILE"; then
    echo "✅ Use Log já existe"
else
    # Encontrar linha do Auth ou usar DB_LINE+1
    AUTH_LINE=$(grep -n "Facades.*Auth" "$CONTROLLER_FILE" | head -1 | cut -d: -f1)
    if [ -z "$AUTH_LINE" ]; then
        AUTH_LINE=$((DB_LINE + 1))
    fi
    echo "📝 Adicionando use Log após linha $AUTH_LINE..."
    sudo sed -i "${AUTH_LINE}a\\use Illuminate\\Support\\Facades\\Log;" "$CONTROLLER_FILE"
    echo "✅ Use Log adicionado"
fi

echo ""
echo "📝 Imports de Facades após adição:"
echo "=========================================="
grep "Facades" "$CONTROLLER_FILE"
echo "=========================================="
echo ""

# Verificar sintaxe
echo "🔍 Verificando sintaxe..."
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

echo "✅ Imports adicionados com sucesso!"


