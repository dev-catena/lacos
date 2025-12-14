#!/bin/bash

echo "🔧 Corrigindo imports no CaregiverController..."
echo ""

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

# Fazer backup
cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup: $BACKUP_FILE"
echo ""

# Verificar imports atuais
echo "📝 Verificando imports atuais..."
grep "^use " "$CONTROLLER_FILE" | head -10
echo ""

# Verificar se tem use Auth
if ! grep -q "use Illuminate\\Support\\Facades\\Auth;" "$CONTROLLER_FILE"; then
    echo "❌ Use Auth NÃO encontrado - adicionando..."
    # Adicionar após namespace
    sed -i "/^namespace App\\Http\\Controllers\\Api;/a use Illuminate\\Support\\Facades\\Auth;" "$CONTROLLER_FILE"
    echo "✅ Use Auth adicionado"
else
    echo "✅ Use Auth já existe"
fi

# Verificar se tem use DB
if ! grep -q "use Illuminate\\Support\\Facades\\DB;" "$CONTROLLER_FILE"; then
    echo "❌ Use DB NÃO encontrado - adicionando..."
    sed -i "/^use Illuminate\\Support\\Facades\\Auth;/a use Illuminate\\Support\\Facades\\DB;" "$CONTROLLER_FILE"
    echo "✅ Use DB adicionado"
else
    echo "✅ Use DB já existe"
fi

# Verificar se tem use Log
if ! grep -q "use Illuminate\\Support\\Facades\\Log;" "$CONTROLLER_FILE"; then
    echo "❌ Use Log NÃO encontrado - adicionando..."
    sed -i "/^use Illuminate\\Support\\Facades\\DB;/a use Illuminate\\Support\\Facades\\Log;" "$CONTROLLER_FILE"
    echo "✅ Use Log adicionado"
else
    echo "✅ Use Log já existe"
fi

echo ""
echo "📝 Imports após correção:"
grep "^use " "$CONTROLLER_FILE" | head -15
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
    cp "$BACKUP_FILE" "$CONTROLLER_FILE"
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

echo "✅ Correção concluída!"


