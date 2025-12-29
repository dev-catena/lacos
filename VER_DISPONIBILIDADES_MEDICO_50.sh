#!/bin/bash

# Script para ver disponibilidades do médico ID 50

SERVER="darley@193.203.182.22"
SSH_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

read -sp "Digite a senha do servidor: " SUDO_PASS
echo ""

echo "📋 Disponibilidades do médico ID 50 (Carlos Abacaxi):"
echo "═══════════════════════════════════════════════════════════"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S mysql -u root -p\$(grep DB_PASSWORD $BACKEND_PATH/.env 2>/dev/null | cut -d '=' -f2 | tr -d ' ' || echo '') lacos -e \"SELECT da.id, da.doctor_id, da.date, da.is_available, da.created_at, da.updated_at, GROUP_CONCAT(dat.time ORDER BY dat.time) as horarios FROM doctor_availability da LEFT JOIN doctor_availability_times dat ON dat.availability_id = da.id WHERE da.doctor_id = 50 GROUP BY da.id ORDER BY da.date DESC, da.id DESC;\" 2>&1"
echo ""

echo "📋 Contagem de horários por disponibilidade:"
echo "═══════════════════════════════════════════════════════════"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S mysql -u root -p\$(grep DB_PASSWORD $BACKEND_PATH/.env 2>/dev/null | cut -d '=' -f2 | tr -d ' ' || echo '') lacos -e \"SELECT da.id, da.date, COUNT(dat.id) as total_horarios FROM doctor_availability da LEFT JOIN doctor_availability_times dat ON dat.availability_id = da.id WHERE da.doctor_id = 50 GROUP BY da.id ORDER BY da.date DESC;\" 2>&1"
echo ""

echo "✅ Verificação concluída"



