#!/bin/bash

# Script para copiar arquivos do sensor de queda para o servidor
# Execute este script na sua máquina local

echo "📦 Preparando arquivos do sensor de queda para o servidor..."
echo ""

# Diretório local
LOCAL_DIR="/home/darley/lacos/backend-laravel"
SERVER_USER="darley"
SERVER_HOST="10.102.0.103"
SERVER_DIR="/var/www/lacos-backend"

# Verificar se os arquivos existem localmente
echo "🔍 Verificando arquivos locais..."

FILES=(
    "create_fall_sensor_data_table.php"
    "FallSensorData.php"
    "FallSensorController.php"
    "INSTALAR_SENSOR_QUEDA.sh"
)

for file in "${FILES[@]}"; do
    if [ ! -f "$LOCAL_DIR/$file" ]; then
        echo "❌ Arquivo não encontrado: $file"
        exit 1
    fi
    echo "✅ $file"
done

echo ""
echo "📤 Copiando arquivos para o servidor..."

# Copiar arquivos via SCP
scp "$LOCAL_DIR/create_fall_sensor_data_table.php" \
    "$LOCAL_DIR/FallSensorData.php" \
    "$LOCAL_DIR/FallSensorController.php" \
    "$LOCAL_DIR/INSTALAR_SENSOR_QUEDA.sh" \
    "$SERVER_USER@$SERVER_HOST:$SERVER_DIR/"

if [ $? -eq 0 ]; then
    echo "✅ Arquivos copiados com sucesso!"
    echo ""
    echo "📋 Próximos passos:"
    echo "   1. Conecte ao servidor: ssh $SERVER_USER@$SERVER_HOST"
    echo "   2. Execute: cd $SERVER_DIR"
    echo "   3. Execute: bash INSTALAR_SENSOR_QUEDA.sh"
else
    echo "❌ Erro ao copiar arquivos"
    exit 1
fi

