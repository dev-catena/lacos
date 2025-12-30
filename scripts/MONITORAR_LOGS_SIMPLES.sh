#!/bin/bash

# Script simples para monitorar logs do Laravel em tempo real

SERVER="darley@193.203.182.22"
SSH_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

read -sp "Digite a senha do servidor: " SUDO_PASS
echo ""

echo "👀 Monitorando logs do Laravel em tempo real..."
echo "Pressione Ctrl+C para parar"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Monitorar logs em tempo real
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S tail -f $BACKEND_PATH/storage/logs/laravel.log 2>/dev/null"





