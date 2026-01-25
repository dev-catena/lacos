#!/bin/bash

# Script para ver a parte do método que valida datas

SERVER="darley@10.102.0.103"
SSH_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

read -sp "Digite a senha do servidor: " SUDO_PASS
echo ""

echo "📋 Parte do método que valida datas:"
echo "═══════════════════════════════════════════════════════════"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S sed -n '/foreach (\$availableDays/,/continue;/p' $BACKEND_PATH/app/Http/Controllers/Api/DoctorController.php | head -20"
echo ""





