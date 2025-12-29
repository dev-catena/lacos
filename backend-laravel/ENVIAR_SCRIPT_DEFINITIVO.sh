#!/bin/bash

# (DEPRECADO) Script antigo. Mantido para compatibilidade.
# A imagem atual da Evolution API exige PostgreSQL; use o script novo:
#   backend-laravel/ENVIAR_SCRIPT_EVOLUTION_POSTGRES.sh

SERVER="root@lacos"
SCRIPT="INSTALAR_EVOLUTION_API_COM_POSTGRES.sh"

echo "📤 Enviando $SCRIPT (PostgreSQL) para o servidor..."
scp backend-laravel/$SCRIPT backend-laravel/CRIAR_INSTANCIA_WHATSAPP.sh backend-laravel/VERIFICAR_EVOLUTION_API.sh $SERVER:/tmp/

if [ $? -eq 0 ]; then
    echo "✅ Script enviado com sucesso!"
    echo ""
    echo "📋 Execute no servidor:"
    echo "   sudo bash /tmp/$SCRIPT"
    echo ""
    echo "Depois (criar instância/QR):"
    echo "   export WHATSAPP_API_URL=http://localhost:8080"
    echo "   export WHATSAPP_API_KEY=<a key impressa pelo instalador>"
    echo "   export WHATSAPP_INSTANCE_NAME=lacos-2fa"
    echo "   sudo -E bash /tmp/CRIAR_INSTANCIA_WHATSAPP.sh"
else
    echo "❌ Erro ao enviar script"
    exit 1
fi

