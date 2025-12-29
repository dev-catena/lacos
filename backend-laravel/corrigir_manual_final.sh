#!/bin/bash

echo "🔧 Corrigindo getClients manualmente..."
echo ""

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

# Fazer backup
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup: $BACKUP_FILE"
echo ""

# Encontrar linha com busca em doctors
DOCTOR_LINE=$(grep -n "\$doctor = DB::table('doctors')" "$CONTROLLER_FILE" | cut -d: -f1)

if [ -n "$DOCTOR_LINE" ]; then
    echo "📝 Encontrada busca em doctors na linha $DOCTOR_LINE"
    
    # Encontrar linha do if
    IF_LINE=$(sed -n "${DOCTOR_LINE},\$p" "$CONTROLLER_FILE" | grep -n "if (\$isDoctor\|if (\$doctor)" | head -1 | cut -d: -f1)
    IF_LINE=$((DOCTOR_LINE + IF_LINE - 1))
    
    echo "📝 Linha do if: $IF_LINE"
    
    # Remover linhas da busca em doctors até antes do if
    if [ "$IF_LINE" -gt "$DOCTOR_LINE" ]; then
        # Remover comentário "Verificar se o usuário é médico" também se existir
        COMMENT_LINE=$(sed -n "1,${DOCTOR_LINE}p" "$CONTROLLER_FILE" | grep -n "Verificar se o usuário é médico" | tail -1 | cut -d: -f1)
        
        if [ -n "$COMMENT_LINE" ] && [ "$COMMENT_LINE" -lt "$DOCTOR_LINE" ]; then
            START_DELETE=$COMMENT_LINE
        else
            START_DELETE=$DOCTOR_LINE
        fi
        
        echo "📝 Removendo linhas $START_DELETE até $((IF_LINE - 1))"
        sudo sed -i "${START_DELETE},$((IF_LINE - 1))d" "$CONTROLLER_FILE"
        
        # Adicionar verificação correta antes do if
        NEW_IF_LINE=$((START_DELETE))
        sudo sed -i "${NEW_IF_LINE}i\\            // Verificar se o usuário é médico (doctor_id nos appointments é o user_id)\\n            \$isDoctor = \$user->profile === 'doctor';" "$CONTROLLER_FILE"
        
        echo "✅ Busca em doctors removida e verificação adicionada"
    fi
fi

# Corrigir if ($doctor) para if ($isDoctor)
sudo sed -i "s/if (\$doctor) {/if (\$isDoctor) {/" "$CONTROLLER_FILE"

# Corrigir qualquer uso de $doctor->id para $user->id
sudo sed -i "s/\$doctor->id/\$user->id/g" "$CONTROLLER_FILE"

echo ""
echo "📝 Verificando sintaxe PHP..."
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


