#!/bin/bash

# Script para baixar routes/api.php do servidor

SERVER="darley@10.102.0.103"
PORT="63022"
REMOTE_FILE="/var/www/lacos-backend/routes/api.php"
LOCAL_FILE="/tmp/api_servidor.php"

echo "📥 Baixando routes/api.php do servidor..."
echo ""
echo "Execute manualmente:"
echo "  scp -P $PORT $SERVER:$REMOTE_FILE $LOCAL_FILE"
echo ""
echo "Ou conecte via SSH e copie o conteúdo:"
echo "  ssh -p $PORT $SERVER 'cat $REMOTE_FILE' > $LOCAL_FILE"
echo ""









