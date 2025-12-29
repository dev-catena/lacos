#!/bin/bash

# Script para verificar se a correção de validação de data foi aplicada

SERVER="darley@193.203.182.22"
SSH_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

read -sp "Digite a senha do servidor: " SUDO_PASS
echo ""

echo "🔍 Verificando se a correção foi aplicada..."
echo ""

sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S bash" << 'REMOTE_SCRIPT'
BACKEND_PATH="/var/www/lacos-backend"
cd "$BACKEND_PATH"

echo "📋 Linha de validação de data atual:"
echo "═══════════════════════════════════════════════════════════"
grep -n "startOfDay\|isPast" app/Http/Controllers/Api/DoctorController.php | grep -A 2 -B 2 "foreach.*availableDays" | head -15
echo ""

echo "📋 Contexto completo da validação:"
echo "═══════════════════════════════════════════════════════════"
grep -A 10 "foreach.*availableDays" app/Http/Controllers/Api/DoctorController.php | grep -A 10 "Carbon::parse" | head -15
echo ""

# Verificar se usa startOfDay
if grep -q "startOfDay" app/Http/Controllers/Api/DoctorController.php; then
    echo "✅ Correção aplicada: usa startOfDay()"
else
    echo "⚠️  Ainda usa isPast() - correção pode não ter sido aplicada"
fi

echo ""
echo "✅ Verificação concluída"
REMOTE_SCRIPT



