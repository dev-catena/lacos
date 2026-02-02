#!/bin/bash

# Script para ver logs relacionados a saveAvailability do médico ID 50

SERVER="darley@10.102.0.103"
SSH_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

read -sp "Digite a senha do servidor: " SUDO_PASS
echo ""

echo "📋 Últimos logs relacionados a saveAvailability (médico ID 50):"
echo "═══════════════════════════════════════════════════════════"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S tail -200 $BACKEND_PATH/storage/logs/laravel.log | grep -i -E 'saveAvailability|availability|doctor.*50|POST.*doctors.*50' | tail -30"
echo ""

echo "📋 Últimas requisições POST para /doctors (últimas 10):"
echo "═══════════════════════════════════════════════════════════"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S tail -500 $BACKEND_PATH/storage/logs/laravel.log | grep -i 'POST.*doctors' | tail -10"
echo ""

echo "📋 Últimos erros (últimas 5 entradas):"
echo "═══════════════════════════════════════════════════════════"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S tail -1000 $BACKEND_PATH/storage/logs/laravel.log | grep -E '^\[.*ERROR' | tail -5"
echo ""

echo "📋 Verificando se há disponibilidades para o médico ID 50:"
echo "═══════════════════════════════════════════════════════════"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S mysql -u root -p\$(grep DB_PASSWORD $BACKEND_PATH/.env 2>/dev/null | cut -d '=' -f2 | tr -d ' ' || echo '') lacos -e \"SELECT COUNT(*) as total FROM doctor_availability WHERE doctor_id = 50;\" 2>&1"
echo ""





