#!/bin/bash

# Script para corrigir MedicalSpecialtyController e aplicar no servidor

set -e

SERVER="192.168.0.20"
USER="darley"
PASSWORD="yhvh77"
PORT="63022"
BACKEND_DIR="/var/www/lacos-backend"
CONTROLLER_PATH="app/Http/Controllers/Api/MedicalSpecialtyController.php"

echo "🔧 Corrigindo MedicalSpecialtyController..."
echo ""

# Enviar controller para /tmp
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTROLLER_FILE="$SCRIPT_DIR/MedicalSpecialtyController.php"

if [ ! -f "$CONTROLLER_FILE" ]; then
    echo "❌ Erro: MedicalSpecialtyController.php não encontrado em $CONTROLLER_FILE"
    exit 1
fi

echo "📤 Enviando MedicalSpecialtyController.php para /tmp no servidor..."
sshpass -p "$PASSWORD" scp -P "$PORT" -o StrictHostKeyChecking=no \
  "$CONTROLLER_FILE" \
  "$USER@$SERVER:/tmp/MedicalSpecialtyController.php"

echo ""
echo "🔧 Aplicando correção no servidor..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" << EOF
    export SUDO_PASS='$PASSWORD'
    cd $BACKEND_DIR
    
    # Fazer backup
    if [ -f $CONTROLLER_PATH ]; then
        echo "\$SUDO_PASS" | sudo -S cp $CONTROLLER_PATH ${CONTROLLER_PATH}.bak.\$(date +%Y%m%d_%H%M%S)
        echo "✅ Backup criado"
    fi
    
    # Substituir o controller
    echo "\$SUDO_PASS" | sudo -S mv /tmp/MedicalSpecialtyController.php $CONTROLLER_PATH
    echo "\$SUDO_PASS" | sudo -S chown www-data:www-data $CONTROLLER_PATH
    echo "\$SUDO_PASS" | sudo -S chmod 644 $CONTROLLER_PATH
    echo "✅ Controller substituído"
    
    # Limpar cache
    echo "\$SUDO_PASS" | sudo -S -u www-data php artisan route:clear
    echo "\$SUDO_PASS" | sudo -S -u www-data php artisan config:clear
    echo "\$SUDO_PASS" | sudo -S -u www-data php artisan cache:clear
    echo "\$SUDO_PASS" | sudo -S -u www-data php artisan optimize:clear
    echo "✅ Cache limpo"
EOF

echo ""
echo "✅ MedicalSpecialtyController corrigido com sucesso!"












