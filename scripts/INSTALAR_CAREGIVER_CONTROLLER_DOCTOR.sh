#!/bin/bash

echo "🔧 Instalando CaregiverController com suporte a perfil 'doctor'..."
echo ""

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

# Fazer backup
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# Copiar novo controller
echo "📝 Copiando novo controller..."
sudo cp /tmp/CaregiverController_COM_DOCTOR.php "$CONTROLLER_FILE"
sudo chown www-data:www-data "$CONTROLLER_FILE"
echo "✅ Controller copiado"
echo ""

# Verificar sintaxe
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

# Limpar cache
echo "🧹 Limpando cache..."
php artisan optimize:clear > /dev/null 2>&1
php artisan config:clear > /dev/null 2>&1
php artisan cache:clear > /dev/null 2>&1
echo "✅ Cache limpo"
echo ""

echo "✅ Concluído!"
echo ""
echo "📋 Resumo:"
echo "   - Backup: $BACKUP_FILE"
echo "   - CaregiverController atualizado para aceitar perfil 'doctor'"
echo "   - Sintaxe verificada e válida"
echo ""

