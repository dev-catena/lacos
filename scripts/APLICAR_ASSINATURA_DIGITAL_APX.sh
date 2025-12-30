#!/bin/bash

# Script para aplicar suporte a assinatura digital .apx no servidor

SERVER="darley@193.203.182.22"
PORT="63022"
PASSWORD="yhvh77"
TMP_DIR="/tmp"
BACKEND_DIR="/var/www/lacos-backend"

echo "🚀 Aplicando suporte a assinatura digital .apx..."
echo ""

# Enviar arquivos
echo "📤 Enviando arquivos para o servidor..."
sshpass -p "$PASSWORD" scp -P "$PORT" \
  backend-laravel/add_certificate_apx_to_users.php \
  backend-laravel/CertificateController_APX.php \
  backend-laravel/DigitalSignatureService_APX.php \
  "$SERVER:$TMP_DIR/"

echo ""
echo "✅ Arquivos enviados!"
echo ""
echo "📝 Execute no servidor:"
echo "   ssh -p $PORT $SERVER"
echo "   sudo bash $TMP_DIR/APLICAR_ASSINATURA_DIGITAL_APX_SERVIDOR.sh"






