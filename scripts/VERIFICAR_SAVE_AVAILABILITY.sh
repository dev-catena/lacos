#!/bin/bash

# Script simples para verificar se saveAvailability está instalado

SERVER="darley@10.102.0.103"
SSH_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

read -sp "Digite a senha do servidor: " SUDO_PASS
echo ""

echo "🔍 Verificando instalação do saveAvailability..."
echo ""

# Verificar método
echo "1️⃣ Verificando método saveAvailability no DoctorController:"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S grep -A 5 'public function saveAvailability' $BACKEND_PATH/app/Http/Controllers/Api/DoctorController.php" || echo "❌ Método NÃO encontrado"
echo ""

# Verificar rota
echo "2️⃣ Verificando rota POST:"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S grep 'Route::post.*doctors.*availability' $BACKEND_PATH/routes/api.php" || echo "❌ Rota NÃO encontrada"
echo ""

# Verificar rotas registradas
echo "3️⃣ Verificando rotas registradas no Laravel:"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "cd $BACKEND_PATH && echo '$SUDO_PASS' | sudo -S php artisan route:list | grep availability" || echo "❌ Rota não registrada"
echo ""

echo "✅ Verificação concluída"





