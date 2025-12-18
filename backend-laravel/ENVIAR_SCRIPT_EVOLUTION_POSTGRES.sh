#!/bin/bash

# Envia os scripts necessários para instalar Evolution API + PostgreSQL
# e criar a instância do WhatsApp, para /tmp no servidor.

set -e

SERVER="${SERVER:-root@lacos}"

echo "📤 Enviando scripts para $SERVER:/tmp ..."
scp \
  backend-laravel/INSTALAR_EVOLUTION_API_COM_POSTGRES.sh \
  backend-laravel/CRIAR_INSTANCIA_WHATSAPP.sh \
  backend-laravel/VERIFICAR_EVOLUTION_API.sh \
  "$SERVER:/tmp/"

echo ""
echo "✅ Enviado!"
echo ""
echo "📋 No servidor, execute:"
echo "   sudo bash /tmp/INSTALAR_EVOLUTION_API_COM_POSTGRES.sh"
echo ""
echo "Depois, criar instância/QR:"
echo "   export WHATSAPP_API_URL=http://localhost:8080"
echo "   export WHATSAPP_API_KEY=<a key impressa pelo script>"
echo "   export WHATSAPP_INSTANCE_NAME=lacos-2fa"
echo "   sudo -E bash /tmp/CRIAR_INSTANCIA_WHATSAPP.sh"


