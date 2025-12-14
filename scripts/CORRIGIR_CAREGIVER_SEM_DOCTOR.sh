#!/bin/bash

echo "🔧 Corrigindo CaregiverController para excluir médicos da lista..."
echo ""

cd /var/www/lacos-backend || exit 1

ROUTES_FILE="app/Http/Controllers/Api/CaregiverController.php"
BACKUP_FILE="${ROUTES_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

sudo cp "$ROUTES_FILE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# Verificar sintaxe do novo arquivo
if php -l /tmp/CaregiverController_SEM_DOCTOR.php > /dev/null 2>&1; then
    echo "✅ Sintaxe do novo arquivo válida"
else
    echo "❌ Erro de sintaxe no novo arquivo"
    php -l /tmp/CaregiverController_SEM_DOCTOR.php
    exit 1
fi

# Copiar novo arquivo
echo "📝 Copiando novo controller..."
sudo cp /tmp/CaregiverController_SEM_DOCTOR.php "$ROUTES_FILE"
echo "✅ Controller atualizado"
echo ""

# Verificar sintaxe do arquivo copiado
if php -l "$ROUTES_FILE" > /dev/null 2>&1; then
    echo "✅ Sintaxe PHP válida"
else
    echo "❌ Erro de sintaxe após cópia"
    php -l "$ROUTES_FILE"
    sudo cp "$BACKUP_FILE" "$ROUTES_FILE"
    exit 1
fi

# Verificar se o método index filtra apenas professional_caregiver
echo "🔍 Verificando filtro no método index..."
if grep -q "where('profile', 'professional_caregiver')" "$ROUTES_FILE"; then
    echo "✅ Filtro correto: apenas professional_caregiver"
else
    echo "⚠️ Verifique o filtro manualmente"
fi

# Limpar cache
echo ""
echo "🧹 Limpando cache..."
php artisan route:clear > /dev/null 2>&1
php artisan config:clear > /dev/null 2>&1
php artisan cache:clear > /dev/null 2>&1
echo "✅ Cache limpo"
echo ""

echo "✅ Concluído!"
echo ""
echo "📋 Resumo:"
echo "   - CaregiverController atualizado"
echo "   - Médicos excluídos da lista de cuidadores profissionais"
echo "   - Apenas profile='professional_caregiver' será listado"
echo ""

