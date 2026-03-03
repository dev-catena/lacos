#!/bin/bash

# Script para ver requisições recentes ao servidor

SERVER="darley@192.168.0.20"
SSH_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

read -sp "Digite a senha do servidor: " SUDO_PASS
echo ""

echo "📋 Últimas requisições HTTP (últimas 50 linhas do log):"
echo "═══════════════════════════════════════════════════════════"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S tail -50 $BACKEND_PATH/storage/logs/laravel.log | grep -E 'POST|GET|PUT|DELETE' | tail -20"
echo ""

echo "📋 Buscando por requisições POST para /doctors (últimas 10):"
echo "═══════════════════════════════════════════════════════════"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S tail -1000 $BACKEND_PATH/storage/logs/laravel.log | grep -i 'POST.*doctors' | tail -10"
echo ""

echo "📋 Verificando logs de autenticação (401, 403):"
echo "═══════════════════════════════════════════════════════════"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S tail -500 $BACKEND_PATH/storage/logs/laravel.log | grep -i -E '401|403|unauthorized|forbidden' | tail -10"
echo ""

echo "✅ Verificação concluída"
echo ""
echo "💡 Se não aparecer nenhuma requisição POST para /doctors, significa que:"
echo "   - A requisição não está chegando ao servidor"
echo "   - Ou está sendo bloqueada antes de chegar ao Laravel"
echo "   - Ou há um erro no frontend que impede o envio"





