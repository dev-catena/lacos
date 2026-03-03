#!/bin/bash

# Script para testar o endpoint saveAvailability diretamente

SERVER="darley@192.168.0.20"
SSH_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

read -sp "Digite a senha do servidor: " SUDO_PASS
echo ""

echo "🧪 Testando endpoint saveAvailability diretamente"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Solicitar ID do médico
read -p "Digite o ID do médico para testar: " DOCTOR_ID
DOCTOR_ID=${DOCTOR_ID:-28}

echo ""
echo "📤 Enviando requisição POST para /api/doctors/$DOCTOR_ID/availability"
echo ""

# Criar dados de teste
TEST_DATA='{
  "availableDays": ["2025-12-29", "2025-12-30"],
  "daySchedules": {
    "2025-12-29": ["08:00", "09:00", "14:00"],
    "2025-12-30": ["10:00", "11:00"]
  }
}'

# Obter token (precisa ser fornecido ou buscar do banco)
echo "💡 Para testar completamente, você precisa de um token de autenticação."
echo "   Vou testar sem autenticação primeiro para ver o erro:"
echo ""

# Testar sem token primeiro
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "curl -X POST http://localhost/api/doctors/$DOCTOR_ID/availability \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '$TEST_DATA' \
  2>&1"

echo ""
echo ""
echo "💡 Se retornou erro 401, o endpoint existe mas precisa de autenticação."
echo "   Se retornou erro 404, a rota não está registrada."
echo "   Se retornou erro 500, há um problema no método."
echo ""





