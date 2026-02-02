#!/bin/bash

# Script para ver o erro completo mais recente

SERVER="darley@10.102.0.103"
SSH_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

read -sp "Digite a senha do servidor: " SUDO_PASS
echo ""

echo "📋 Último erro completo (última entrada de ERROR):"
echo "═══════════════════════════════════════════════════════════"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S tail -1000 $BACKEND_PATH/storage/logs/laravel.log | grep -E '^\[.*ERROR' -A 50 | tail -60"
echo ""

echo "📋 Últimas 20 linhas do log (contexto):"
echo "═══════════════════════════════════════════════════════════"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S tail -20 $BACKEND_PATH/storage/logs/laravel.log"
echo ""





