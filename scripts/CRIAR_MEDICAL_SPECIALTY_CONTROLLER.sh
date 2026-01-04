#!/bin/bash

# Script para criar MedicalSpecialtyController no servidor

SERVER="darley@193.203.182.22"
PORT="63022"
PASSWORD="yhvh77"
TMP_DIR="/tmp"
BACKEND_DIR="/var/www/lacos-backend"

echo "🚀 Criando MedicalSpecialtyController no servidor..."
echo ""

# Enviar arquivos
echo "📤 Enviando arquivos para o servidor..."
sshpass -p "$PASSWORD" scp -P "$PORT" \
  backend-laravel/MedicalSpecialtyController.php \
  backend-laravel/MedicalSpecialty_MODEL.php \
  "$SERVER:$TMP_DIR/"

echo ""
echo "✅ Arquivos enviados!"
echo ""
echo "📝 Execute no servidor:"
echo "   ssh -p $PORT $SERVER"
echo "   sudo bash $TMP_DIR/APLICAR_MEDICAL_SPECIALTY_CONTROLLER.sh"













