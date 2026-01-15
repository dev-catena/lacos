#!/bin/bash

echo "🔧 Corrigindo sintaxe dos imports Auth e Log..."
echo ""

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

# Fazer backup
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup: $BACKUP_FILE"
echo ""

# Corrigir linha do Auth (linha 12)
echo "📝 Corrigindo linha 12 (Auth)..."
sudo sed -i '12s/.*/use Illuminate\\Support\\Facades\\Auth;/' "$CONTROLLER_FILE"
echo "✅ Auth corrigido"

# Corrigir linha do Log (linha 13)
echo "📝 Corrigindo linha 13 (Log)..."
sudo sed -i '13s/.*/use Illuminate\\Support\\Facades\\Log;/' "$CONTROLLER_FILE"
echo "✅ Log corrigido"

echo ""
echo "📝 Imports após correção:"
echo "=========================================="
grep -n "Facades" "$CONTROLLER_FILE"
echo "=========================================="
echo ""

# Verificar sintaxe
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

# Limpar cache
echo ""
echo "🧹 Limpando cache..."
php artisan route:clear > /dev/null 2>&1
php artisan config:clear > /dev/null 2>&1
php artisan cache:clear > /dev/null 2>&1
echo "✅ Cache limpo"
echo ""

echo "✅ Imports corrigidos com sucesso!"


