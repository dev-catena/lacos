#!/bin/bash

# Script para ver método completo e logs recentes

SERVER="darley@10.102.0.103"
SSH_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

read -sp "Digite a senha do servidor: " SUDO_PASS
echo ""

echo "📋 Método saveAvailability completo:"
echo "═══════════════════════════════════════════════════════════"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S awk '/public function saveAvailability/,/^    \}$/' $BACKEND_PATH/app/Http/Controllers/Api/DoctorController.php"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "📋 Últimos logs relacionados a availability:"
echo "═══════════════════════════════════════════════════════════"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S tail -50 $BACKEND_PATH/storage/logs/laravel.log | grep -i 'availability\|doctor.*availability\|saveAvailability' || echo 'Nenhum log encontrado'"
echo ""

echo "📋 Últimos erros no log:"
echo "═══════════════════════════════════════════════════════════"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S tail -30 $BACKEND_PATH/storage/logs/laravel.log | grep -i 'error\|exception' | tail -10 || echo 'Nenhum erro recente'"
echo ""





