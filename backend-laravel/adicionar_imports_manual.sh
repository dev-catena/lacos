#!/bin/bash

echo "🔧 Adicionando imports Auth e Log..."
echo ""

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"

# Encontrar linha do DB
DB_LINE=$(grep -n "use Illuminate\\Support\\Facades\\DB;" "$CONTROLLER_FILE" | head -1 | cut -d: -f1)

if [ -z "$DB_LINE" ]; then
    echo "❌ Não foi possível encontrar a linha do DB"
    exit 1
fi

echo "📝 Linha do DB: $DB_LINE"
echo ""

# Adicionar Auth após DB
if ! grep -q "use Illuminate\\Support\\Facades\\Auth;" "$CONTROLLER_FILE"; then
    echo "📝 Adicionando use Auth na linha $((DB_LINE + 1))..."
    sudo sed -i "${DB_LINE}a use Illuminate\\Support\\Facades\\Auth;" "$CONTROLLER_FILE"
    echo "✅ Use Auth adicionado"
    # Atualizar linha do Auth
    AUTH_LINE=$((DB_LINE + 1))
else
    echo "✅ Use Auth já existe"
    AUTH_LINE=$(grep -n "use Illuminate\\Support\\Facades\\Auth;" "$CONTROLLER_FILE" | head -1 | cut -d: -f1)
fi

# Adicionar Log após Auth
if ! grep -q "use Illuminate\\Support\\Facades\\Log;" "$CONTROLLER_FILE"; then
    echo "📝 Adicionando use Log na linha $((AUTH_LINE + 1))..."
    sudo sed -i "${AUTH_LINE}a use Illuminate\\Support\\Facades\\Log;" "$CONTROLLER_FILE"
    echo "✅ Use Log adicionado"
else
    echo "✅ Use Log já existe"
fi

echo ""
echo "📝 Imports após adição:"
echo "=========================================="
grep "^use Illuminate" "$CONTROLLER_FILE"
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


