#!/bin/bash

echo "🔧 Corrigindo verificação de médico no getClients..."
echo ""

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

# Fazer backup
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup: $BACKUP_FILE"
echo ""

# Substituir verificação de médico
echo "📝 Substituindo verificação de médico..."

# Substituir: $doctor = DB::table('doctors')->where('user_id', $user->id)->first();
sudo sed -i "s/\$doctor = DB::table('doctors')->where('user_id', \$user->id)->first();/\/\/ Verificar se o usuário é médico (doctor_id nos appointments é o user_id)\n            \$isDoctor = \$user->profile === 'doctor';/" "$CONTROLLER_FILE"

# Substituir: if ($doctor) {
sudo sed -i "s/if (\$doctor) {/if (\$isDoctor) {/" "$CONTROLLER_FILE"

# Substituir: ->where('doctor_id', $doctor->id)
sudo sed -i "s/->where('doctor_id', \$doctor->id)/->where('doctor_id', \$user->id)/" "$CONTROLLER_FILE"

echo "✅ Verificação corrigida"
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

echo "✅ Correção concluída!"


