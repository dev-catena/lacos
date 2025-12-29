#!/bin/bash

# Script para ver o método saveAvailability completo

SERVER="darley@193.203.182.22"
SSH_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

read -sp "Digite a senha do servidor: " SUDO_PASS
echo ""

echo "📋 Método saveAvailability completo:"
echo "═══════════════════════════════════════════════════════════"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S sed -n '/public function saveAvailability/,/^    }/p' $BACKEND_PATH/app/Http/Controllers/Api/DoctorController.php"
echo ""
echo "═══════════════════════════════════════════════════════════"



