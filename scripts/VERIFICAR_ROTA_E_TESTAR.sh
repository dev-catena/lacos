#!/bin/bash

# Script para verificar se a rota está registrada e testar

SERVER="darley@192.168.0.20"
SSH_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

read -sp "Digite a senha do servidor: " SUDO_PASS
echo ""

echo "🔍 Verificando se a rota está registrada..."
echo ""

echo "1️⃣ Listando rotas relacionadas a doctors/availability:"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "cd $BACKEND_PATH && echo '$SUDO_PASS' | sudo -S php artisan route:list | grep -i 'availability'"
echo ""

echo "2️⃣ Verificando se a rota POST existe em routes/api.php:"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S grep -n 'Route::post.*doctors.*availability' $BACKEND_PATH/routes/api.php || echo 'Rota POST não encontrada'"
echo ""

echo "3️⃣ Verificando se está dentro do middleware auth:sanctum:"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S sed -n '/Route::post.*doctors.*availability/,/Route::/p' $BACKEND_PATH/routes/api.php | head -5"
echo ""

echo "4️⃣ Último erro completo (primeira linha do erro):"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S tail -2000 $BACKEND_PATH/storage/logs/laravel.log | grep -E '^\[.*ERROR' | tail -1 | head -c 500"
echo ""
echo ""

echo "✅ Verificação concluída"





