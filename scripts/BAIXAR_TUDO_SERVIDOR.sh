#!/bin/bash

# Script principal para baixar todos os arquivos do servidor
# Tenta diferentes métodos de autenticação

SERVER="darley@10.102.0.103"
PORT="63022"
REMOTE_PATH="/var/www/lacos-backend"
LOCAL_PATH="/home/darley/lacos/backend-laravel"

echo "🚀 Iniciando download de arquivos do servidor..."
echo ""

# Função para baixar usando rsync
download_with_rsync() {
    echo "📥 Tentando baixar com rsync..."
    
    # Controllers
    echo "  📁 Controllers..."
    rsync -avz --progress -e "ssh -p $PORT -o StrictHostKeyChecking=no" \
        "$SERVER:$REMOTE_PATH/app/Http/Controllers/" \
        "$LOCAL_PATH/app/Http/Controllers/" 2>/dev/null
    
    # Models
    echo "  📁 Models..."
    rsync -avz --progress -e "ssh -p $PORT -o StrictHostKeyChecking=no" \
        "$SERVER:$REMOTE_PATH/app/Models/" \
        "$LOCAL_PATH/app/Models/" 2>/dev/null
    
    # Migrations
    echo "  📁 Migrations..."
    rsync -avz --progress -e "ssh -p $PORT -o StrictHostKeyChecking=no" \
        "$SERVER:$REMOTE_PATH/database/migrations/" \
        "$LOCAL_PATH/database/migrations/" 2>/dev/null
}

# Tentar método 1: rsync
if download_with_rsync; then
    echo ""
    echo "✅ Download concluído com sucesso usando rsync!"
    exit 0
fi

echo ""
echo "⚠️  Autenticação automática não funcionou."
echo ""
echo "📋 Por favor, execute manualmente um dos seguintes métodos:"
echo ""
echo "MÉTODO 1 - Usar o script de backup no servidor:"
echo "  1. scp -P $PORT scripts/CRIAR_BACKUP_SERVIDOR.sh $SERVER:/tmp/"
echo "  2. ssh -p $PORT $SERVER 'bash /tmp/CRIAR_BACKUP_SERVIDOR.sh'"
echo "  3. scp -P $PORT $SERVER:/tmp/lacos_backup_*.tar.gz /tmp/lacos_backup.tar.gz"
echo "  4. cd $LOCAL_PATH && tar -xzf /tmp/lacos_backup.tar.gz"
echo ""
echo "MÉTODO 2 - Usar rsync manualmente:"
echo "  rsync -avz -e \"ssh -p $PORT\" $SERVER:$REMOTE_PATH/app/Http/Controllers/ $LOCAL_PATH/app/Http/Controllers/"
echo "  rsync -avz -e \"ssh -p $PORT\" $SERVER:$REMOTE_PATH/app/Models/ $LOCAL_PATH/app/Models/"
echo "  rsync -avz -e \"ssh -p $PORT\" $SERVER:$REMOTE_PATH/database/migrations/ $LOCAL_PATH/database/migrations/"
echo ""
echo "📖 Veja mais detalhes em: scripts/INSTRUCOES_BAIXAR_SERVIDOR.md"





