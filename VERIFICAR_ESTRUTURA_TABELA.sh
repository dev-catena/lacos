#!/bin/bash

# Script para verificar estrutura das tabelas de availability

SERVER="darley@193.203.182.22"
SSH_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

read -sp "Digite a senha do servidor: " SUDO_PASS
echo ""

echo "📋 Estrutura da tabela doctor_availability:"
echo "═══════════════════════════════════════════════════════════"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S mysql -u root -p\$(grep DB_PASSWORD $BACKEND_PATH/.env | cut -d '=' -f2 | tr -d ' ') lacos -e 'DESCRIBE doctor_availability;' 2>/dev/null || echo 'Erro ao conectar ao banco'"
echo ""

echo "📋 Estrutura da tabela doctor_availability_times:"
echo "═══════════════════════════════════════════════════════════"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S mysql -u root -p\$(grep DB_PASSWORD $BACKEND_PATH/.env | cut -d '=' -f2 | tr -d ' ') lacos -e 'DESCRIBE doctor_availability_times;' 2>/dev/null || echo 'Erro ao conectar ao banco'"
echo ""

echo "📋 Dados de exemplo na tabela doctor_availability:"
echo "═══════════════════════════════════════════════════════════"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S mysql -u root -p\$(grep DB_PASSWORD $BACKEND_PATH/.env | cut -d '=' -f2 | tr -d ' ') lacos -e 'SELECT * FROM doctor_availability LIMIT 3;' 2>/dev/null || echo 'Erro ao conectar ao banco'"
echo ""

echo "📋 Dados de exemplo na tabela doctor_availability_times:"
echo "═══════════════════════════════════════════════════════════"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S mysql -u root -p\$(grep DB_PASSWORD $BACKEND_PATH/.env | cut -d '=' -f2 | tr -d ' ') lacos -e 'SELECT * FROM doctor_availability_times LIMIT 3;' 2>/dev/null || echo 'Erro ao conectar ao banco'"
echo ""



