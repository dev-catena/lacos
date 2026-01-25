#!/bin/bash

echo "🔧 Atualizando CaregiverController para aceitar perfil 'doctor'..."
echo ""

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

# Fazer backup
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# Atualizar verificações de perfil para incluir 'doctor'
# Substituir verificações de professional_caregiver para aceitar também doctor
sudo sed -i "s/profile !== 'professional_caregiver'/profile !== 'professional_caregiver' \&\& \$user->profile !== 'doctor'/" "$CONTROLLER_FILE"
sudo sed -i "s/profile === 'professional_caregiver'/profile === 'professional_caregiver' || \$user->profile === 'doctor'/" "$CONTROLLER_FILE"
sudo sed -i "s/where('profile', 'professional_caregiver')/whereIn('profile', ['professional_caregiver', 'doctor'])/" "$CONTROLLER_FILE"

# Verificar sintaxe
if php -l "$CONTROLLER_FILE" > /dev/null 2>&1; then
    echo "✅ CaregiverController atualizado"
else
    echo "❌ Erro de sintaxe no CaregiverController"
    php -l "$CONTROLLER_FILE"
    sudo cp "$BACKUP_FILE" "$CONTROLLER_FILE"
    exit 1
fi
echo ""

# Limpar cache
echo "🧹 Limpando cache..."
php artisan optimize:clear > /dev/null 2>&1
echo "✅ Cache limpo"
echo ""

echo "✅ Concluído!"

