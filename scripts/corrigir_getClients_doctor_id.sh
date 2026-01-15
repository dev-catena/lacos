#!/bin/bash

echo "🔧 Corrigindo getClients para usar user_id como doctor_id..."
echo ""

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

# Fazer backup
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup: $BACKUP_FILE"
echo ""

# Encontrar método getClients
START_LINE=$(grep -n "public function getClients" "$CONTROLLER_FILE" | cut -d: -f1)
if [ -z "$START_LINE" ]; then
    echo "❌ Método getClients não encontrado!"
    exit 1
fi

# Encontrar linha com verificação de médico
DOCTOR_CHECK_LINE=$(sed -n "${START_LINE},\$p" "$CONTROLLER_FILE" | grep -n "Verificar se o usuário é médico\|doctors.*where" | head -1 | cut -d: -f1)
DOCTOR_CHECK_LINE=$((START_LINE + DOCTOR_CHECK_LINE - 1))

if [ -n "$DOCTOR_CHECK_LINE" ]; then
    echo "📝 Corrigindo verificação de médico (linha $DOCTOR_CHECK_LINE)..."
    
    # Substituir a verificação: ao invés de buscar na tabela doctors, verificar profile
    # Remover linhas da verificação antiga até o if ($doctor)
    END_DOCTOR_CHECK=$(sed -n "${DOCTOR_CHECK_LINE},\$p" "$CONTROLLER_FILE" | grep -n "if (\$doctor)" | head -1 | cut -d: -f1)
    END_DOCTOR_CHECK=$((DOCTOR_CHECK_LINE + END_DOCTOR_CHECK - 1))
    
    # Criar nova verificação
    cat > /tmp/new_doctor_check.txt << 'CHECK_EOF'
            // Verificar se o usuário é médico (profile = 'doctor')
            $isDoctor = $user->profile === 'doctor';

            if ($isDoctor) {
CHECK_EOF

    # Substituir
    sudo sed -i "${DOCTOR_CHECK_LINE},${END_DOCTOR_CHECK}d" "$CONTROLLER_FILE"
    sudo sed -i "${DOCTOR_CHECK_LINE}i\\$(cat /tmp/new_doctor_check.txt)" "$CONTROLLER_FILE"
    rm /tmp/new_doctor_check.txt
    
    # Corrigir a query de appointments para usar user_id como doctor_id
    APPOINTMENTS_LINE=$(sed -n "${START_LINE},\$p" "$CONTROLLER_FILE" | grep -n "appointments.*where.*doctor_id" | head -1 | cut -d: -f1)
    APPOINTMENTS_LINE=$((START_LINE + APPOINTMENTS_LINE - 1))
    
    if [ -n "$APPOINTMENTS_LINE" ]; then
        echo "📝 Corrigindo query de appointments (linha $APPOINTMENTS_LINE)..."
        sudo sed -i "${APPOINTMENTS_LINE}s/doctor_id, \$doctor->id/doctor_id, \$user->id/" "$CONTROLLER_FILE"
        echo "✅ Query corrigida"
    fi
fi

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


