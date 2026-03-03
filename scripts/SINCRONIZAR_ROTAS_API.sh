#!/bin/bash

# Script para sincronizar routes/api.php do servidor com o local

SERVER="darley@192.168.0.20"
PORT="63022"
REMOTE_FILE="/var/www/lacos-backend/routes/api.php"
LOCAL_FILE="/home/darley/lacos/backend-laravel/routes/api.php"
TEMP_SERVER="/tmp/api_servidor.php"

echo "🔍 Sincronizando rotas do servidor..."
echo ""

# Tentar baixar o arquivo
echo "📥 Tentando baixar routes/api.php do servidor..."

# Método 1: Tentar com scp
if scp -P $PORT -o StrictHostKeyChecking=no $SERVER:$REMOTE_FILE $TEMP_SERVER 2>/dev/null; then
    echo "✅ Arquivo baixado com sucesso!"
elif ssh -p $PORT -o StrictHostKeyChecking=no $SERVER "cat $REMOTE_FILE" > $TEMP_SERVER 2>/dev/null; then
    echo "✅ Arquivo baixado via SSH!"
else
    echo "❌ Não foi possível baixar automaticamente."
    echo ""
    echo "Por favor, execute manualmente:"
    echo "  scp -P $PORT $SERVER:$REMOTE_FILE $TEMP_SERVER"
    echo ""
    echo "Ou:"
    echo "  ssh -p $PORT $SERVER 'cat $REMOTE_FILE' > $TEMP_SERVER"
    echo ""
    echo "Depois execute este script novamente."
    exit 1
fi

# Verificar se o arquivo foi baixado
if [ ! -f "$TEMP_SERVER" ] || [ ! -s "$TEMP_SERVER" ]; then
    echo "❌ Arquivo vazio ou não encontrado"
    exit 1
fi

echo ""
echo "🔍 Comparando arquivos..."

# Usar PHP para comparar e sincronizar
php /home/darley/lacos/scripts/SINCRONIZAR_ROTAS_COMPLETO.php

echo ""
echo "✅ Processo concluído!"

