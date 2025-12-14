#!/bin/bash

echo "🔧 Atualizando CaregiverController (correção getClients)..."
echo ""

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

# 1. Fazer backup
echo "📦 Criando backup..."
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# 2. Copiar novo controller
echo "📝 Copiando controller corrigido..."
sudo cp /tmp/CaregiverController_COMPLETO.php "$CONTROLLER_FILE"
sudo chown www-data:www-data "$CONTROLLER_FILE"
echo "✅ Controller atualizado"
echo ""

# 3. Verificar sintaxe PHP
echo "🔍 Verificando sintaxe PHP..."
if php -l "$CONTROLLER_FILE" > /dev/null 2>&1; then
    echo "✅ Sintaxe PHP válida"
else
    echo "❌ Erro de sintaxe detectado"
    php -l "$CONTROLLER_FILE"
    echo ""
    echo "🔄 Restaurando backup..."
    sudo cp "$BACKUP_FILE" "$CONTROLLER_FILE"
    exit 1
fi
echo ""

# 4. Limpar cache
echo "🧹 Limpando cache..."
php artisan route:clear > /dev/null 2>&1
php artisan config:clear > /dev/null 2>&1
php artisan cache:clear > /dev/null 2>&1
echo "✅ Cache limpo"
echo ""

echo "✅ Controller atualizado com sucesso!"
echo ""

