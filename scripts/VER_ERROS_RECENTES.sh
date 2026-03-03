#!/bin/bash

# Script para ver erros recentes relacionados a availability

SERVER="darley@192.168.0.20"
SSH_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

read -sp "Digite a senha do servidor: " SUDO_PASS
echo ""

echo "📋 Últimos erros relacionados a availability/doctors:"
echo "═══════════════════════════════════════════════════════════"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S tail -100 $BACKEND_PATH/storage/logs/laravel.log | grep -i -B 5 -A 10 'availability\|saveAvailability\|doctor.*availability\|POST.*doctors.*availability' | tail -50"
echo ""

echo "📋 Últimas 5 requisições POST para /doctors (se houver):"
echo "═══════════════════════════════════════════════════════════"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S tail -200 $BACKEND_PATH/storage/logs/laravel.log | grep -i 'POST.*doctors' | tail -5"
echo ""

echo "📋 Últimos erros completos (últimas 3 entradas de erro):"
echo "═══════════════════════════════════════════════════════════"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S tail -500 $BACKEND_PATH/storage/logs/laravel.log | grep -E '^\[.*ERROR' -A 30 | tail -100"
echo ""





