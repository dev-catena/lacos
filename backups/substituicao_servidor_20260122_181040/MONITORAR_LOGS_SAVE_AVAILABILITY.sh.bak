#!/bin/bash

# Script para monitorar logs relacionados a saveAvailability

SERVER="darley@193.203.182.22"
SSH_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

read -sp "Digite a senha do servidor: " SUDO_PASS
echo ""

echo "👀 Monitorando logs de saveAvailability..."
echo "Pressione Ctrl+C para parar"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Monitorar logs em tempo real filtrando por availability
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S tail -f $BACKEND_PATH/storage/logs/laravel.log 2>/dev/null | grep --line-buffered -i 'availability\|saveAvailability\|doctor.*availability' || echo 'Aguardando logs... (tente salvar a agenda no app)'"





