#!/bin/bash

# Script para testar a API do sensor de queda
# Execute: bash TESTAR_API_SENSOR_QUEDA.sh

echo "🧪 Testando API do Sensor de Queda"
echo ""

# Configurações
API_URL="http://193.203.182.22/api"
EMAIL="seu_email@exemplo.com"
PASSWORD="sua_senha"
GROUP_ID=1

echo "📋 Configurações:"
echo "   API: $API_URL"
echo "   Email: $EMAIL"
echo "   Grupo ID: $GROUP_ID"
echo ""

# 1. Fazer login
echo "1️⃣ Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Erro ao fazer login"
    echo "   Resposta: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Login realizado! Token obtido"
echo ""

# 2. Testar salvar dados
echo "2️⃣ Testando salvar dados do sensor..."
SAVE_RESPONSE=$(curl -s -X POST "${API_URL}/groups/${GROUP_ID}/fall-sensor/data" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "sensor_mac": "24E4B9E48D8F",
    "posture": "standing",
    "acceleration_x": 0.5,
    "acceleration_y": -0.2,
    "acceleration_z": 9.8,
    "gyro_x": 0.1,
    "gyro_y": 0.05,
    "gyro_z": -0.03,
    "magnitude": 9.85,
    "is_fall_detected": false,
    "confidence": 85.5
  }')

if echo "$SAVE_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Dados salvos com sucesso!"
    echo "$SAVE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$SAVE_RESPONSE"
else
    echo "❌ Erro ao salvar dados"
    echo "$SAVE_RESPONSE"
fi
echo ""

# 3. Testar buscar histórico
echo "3️⃣ Testando buscar histórico..."
HISTORY_RESPONSE=$(curl -s -X GET "${API_URL}/groups/${GROUP_ID}/fall-sensor/history?limit=5" \
  -H "Authorization: Bearer ${TOKEN}")

if echo "$HISTORY_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Histórico obtido!"
    echo "$HISTORY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$HISTORY_RESPONSE"
else
    echo "❌ Erro ao buscar histórico"
    echo "$HISTORY_RESPONSE"
fi
echo ""

# 4. Testar buscar última postura
echo "4️⃣ Testando buscar última postura..."
LATEST_RESPONSE=$(curl -s -X GET "${API_URL}/groups/${GROUP_ID}/fall-sensor/latest" \
  -H "Authorization: Bearer ${TOKEN}")

if echo "$LATEST_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Última postura obtida!"
    echo "$LATEST_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LATEST_RESPONSE"
else
    echo "⚠️  Nenhum dado encontrado ou erro"
    echo "$LATEST_RESPONSE"
fi
echo ""

# 5. Testar buscar alertas
echo "5️⃣ Testando buscar alertas de queda..."
ALERTS_RESPONSE=$(curl -s -X GET "${API_URL}/groups/${GROUP_ID}/fall-sensor/alerts?hours=24" \
  -H "Authorization: Bearer ${TOKEN}")

if echo "$ALERTS_RESPONSE" | grep -q "success.*true"; then
    echo "✅ Alertas obtidos!"
    echo "$ALERTS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ALERTS_RESPONSE"
else
    echo "⚠️  Nenhum alerta encontrado ou erro"
    echo "$ALERTS_RESPONSE"
fi
echo ""

# 6. Verificar no banco de dados
echo "6️⃣ Verificando dados no banco..."
cd /var/www/lacos-backend 2>/dev/null || cd /home/darley/lacos/backend-laravel
DB_NAME=$(sudo grep "^DB_DATABASE=" .env 2>/dev/null | cut -d '=' -f2 | tr -d '"' | tr -d "'" | tr -d ' ' | head -1)
if [ -z "$DB_NAME" ]; then
    DB_NAME="lacos"
fi

echo "   Banco: $DB_NAME"
sudo mysql $DB_NAME -e "SELECT id, posture, posture_pt, is_fall_detected, confidence, created_at FROM fall_sensor_data ORDER BY created_at DESC LIMIT 5;" 2>/dev/null

echo ""
echo "✅ Testes concluídos!"
echo ""
echo "💡 Para testar no app mobile:"
echo "   1. Abra o app e faça login"
echo "   2. Acesse um grupo"
echo "   3. Toque no card 'Sensor de Queda'"
echo "   4. Conecte ao sensor WT901BLE67"
echo "   5. Teste as posturas e verifique os dados"

