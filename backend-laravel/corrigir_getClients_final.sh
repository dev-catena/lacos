#!/bin/bash

echo "🔧 Corrigindo getClients - removendo busca em doctors e usando profile..."
echo ""

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

# Fazer backup
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup: $BACKUP_FILE"
echo ""

# Encontrar e remover a busca na tabela doctors
echo "📝 Removendo busca na tabela doctors..."

# Encontrar linha com "Verificar se o usuário é médico"
DOCTOR_CHECK_START=$(grep -n "Verificar se o usuário é médico" "$CONTROLLER_FILE" | cut -d: -f1)

if [ -n "$DOCTOR_CHECK_START" ]; then
    # Encontrar linha com "if ($isDoctor)" ou "if ($doctor)"
    IF_LINE=$(sed -n "${DOCTOR_CHECK_START},\$p" "$CONTROLLER_FILE" | grep -n "if (\$isDoctor\|if (\$doctor)" | head -1 | cut -d: -f1)
    IF_LINE=$((DOCTOR_CHECK_START + IF_LINE - 1))
    
    # Remover linhas entre DOCTOR_CHECK_START e IF_LINE (excluindo IF_LINE)
    if [ -n "$IF_LINE" ] && [ "$IF_LINE" -gt "$DOCTOR_CHECK_START" ]; then
        echo "   Removendo linhas $DOCTOR_CHECK_START até $((IF_LINE - 1))"
        sudo sed -i "${DOCTOR_CHECK_START},$((IF_LINE - 1))d" "$CONTROLLER_FILE"
        
        # Adicionar verificação correta antes do if
        sudo sed -i "${DOCTOR_CHECK_START}i\\            // Verificar se o usuário é médico (doctor_id nos appointments é o user_id)\n            \$isDoctor = \$user->profile === 'doctor';" "$CONTROLLER_FILE"
        
        # Corrigir o if para usar $isDoctor
        sudo sed -i "s/if (\$doctor) {/if (\$isDoctor) {/" "$CONTROLLER_FILE"
        
        echo "✅ Busca em doctors removida e verificação corrigida"
    fi
fi

# Garantir que usa $user->id ao invés de $doctor->id
echo "📝 Verificando uso de doctor_id..."
sudo sed -i "s/\$doctor->id/\$user->id/g" "$CONTROLLER_FILE"
echo "✅ Uso de doctor_id corrigido"
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


