#!/bin/bash

# Script simples de deploy: build local + deploy
set -e

SERVER="10.102.0.103"
PORT="63022"
USER="darley"
LOCAL_PATH="/Users/darley/lacos/website"
REMOTE_PATH="/var/www/lacos-website"
BUILD_DIR="$LOCAL_PATH/dist"

echo "🚀 Deploy de Produção - Laços Website"
echo ""

# 1. Build local
echo "📦 Fazendo build local..."
cd "$LOCAL_PATH"
npm run build

if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Erro: Build falhou"
    exit 1
fi

echo "✅ Build concluído em: $BUILD_DIR"
echo ""

# 2. Enviar arquivos
echo "📤 Enviando arquivos para o servidor..."
echo "   Senha: yhvh77"
echo ""

# Usar rsync se disponível, senão scp
if command -v rsync &> /dev/null; then
    echo "   Usando rsync..."
    rsync -avz --delete -e "ssh -p $PORT" "$BUILD_DIR/" $USER@$SERVER:~/deploy-dist/
else
    echo "   Usando scp..."
    ssh -p $PORT $USER@$SERVER "rm -rf ~/deploy-dist && mkdir -p ~/deploy-dist"
    scp -P $PORT -r "$BUILD_DIR"/* $USER@$SERVER:~/deploy-dist/
fi

echo ""
echo "✅ Arquivos enviados!"
echo ""
echo "📝 Execute no servidor para finalizar:"
echo ""
echo "   ssh -p $PORT $USER@$SERVER"
echo "   sudo rm -rf $REMOTE_PATH/*"
echo "   sudo cp -r ~/deploy-dist/* $REMOTE_PATH/"
echo "   sudo chown -R www-data:www-data $REMOTE_PATH"
echo "   sudo systemctl restart nginx"
echo ""

