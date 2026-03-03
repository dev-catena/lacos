#!/bin/bash

# Script para verificar se o médico Carlos abacaxi existe

SERVER="darley@192.168.0.20"
SSH_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

read -sp "Digite a senha do servidor: " SUDO_PASS
echo ""

echo "🔍 Verificando médico Carlos abacaxi..."
echo ""

# Buscar na tabela users
echo "1️⃣ Buscando na tabela users:"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S mysql -u root -p\$(grep DB_PASSWORD $BACKEND_PATH/.env 2>/dev/null | cut -d '=' -f2 | tr -d ' ' || echo '') lacos -e \"SELECT id, name, email, profile FROM users WHERE name LIKE '%Carlos%' OR name LIKE '%abacaxi%' OR email = 'coroneldarley@gmail.com';\" 2>&1"
echo ""

# Buscar todos os médicos na tabela users
echo "2️⃣ Todos os usuários com profile='doctor' (últimos 10):"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S mysql -u root -p\$(grep DB_PASSWORD $BACKEND_PATH/.env 2>/dev/null | cut -d '=' -f2 | tr -d ' ' || echo '') lacos -e \"SELECT id, name, email, profile FROM users WHERE profile = 'doctor' ORDER BY id DESC LIMIT 10;\" 2>&1"
echo ""

# Verificar disponibilidades existentes
echo "3️⃣ Últimas disponibilidades salvas (últimos 5 registros):"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S mysql -u root -p\$(grep DB_PASSWORD $BACKEND_PATH/.env 2>/dev/null | cut -d '=' -f2 | tr -d ' ' || echo '') lacos -e \"SELECT da.id, da.doctor_id, u.name as doctor_name, da.date, COUNT(dat.id) as times_count FROM doctor_availability da LEFT JOIN users u ON u.id = da.doctor_id LEFT JOIN doctor_availability_times dat ON dat.availability_id = da.id WHERE da.date >= CURDATE() GROUP BY da.id ORDER BY da.id DESC LIMIT 5;\" 2>&1"
echo ""

echo "✅ Verificação concluída"
