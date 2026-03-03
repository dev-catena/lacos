#!/bin/bash

# Script para verificar o status do deploy do site LaçosApp

SERVER="192.168.0.20"
USER="darley"
PASSWORD="yhvh77"
PORT="63022"
DOMAIN="lacosapp.com"
WEB_DIR="/var/www/lacos-website"

echo "🔍 Verificando status do deploy do site LaçosApp..."
echo ""

# Verificar se sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    echo "⚠️  sshpass não está instalado."
    echo "   Instale com: sudo apt install sshpass"
    exit 1
fi

# Verificar conexão com o servidor
echo "📡 Testando conexão com o servidor..."
if sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no -o ConnectTimeout=5 "$USER@$SERVER" "echo 'Conexão OK'" &> /dev/null; then
    echo "✅ Conexão com servidor estabelecida"
else
    echo "❌ Não foi possível conectar ao servidor"
    exit 1
fi

echo ""

# Verificar se o diretório existe
echo "📁 Verificando diretório no servidor..."
if sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "test -d $WEB_DIR && echo 'OK' || echo 'NÃO EXISTE'"; then
    echo "✅ Diretório $WEB_DIR existe"
else
    echo "⚠️  Diretório $WEB_DIR não existe"
fi

echo ""

# Verificar arquivos no servidor
echo "📄 Verificando arquivos no servidor..."
FILE_COUNT=$(sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "export SUDO_PASS='$PASSWORD'; echo \"\$SUDO_PASS\" | sudo -S ls -1 $WEB_DIR 2>/dev/null | wc -l")
echo "   Arquivos encontrados: $FILE_COUNT"

if [ "$FILE_COUNT" -gt 0 ]; then
    echo "✅ Arquivos encontrados no servidor"
    echo ""
    echo "📋 Primeiros arquivos:"
    sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "export SUDO_PASS='$PASSWORD'; echo \"\$SUDO_PASS\" | sudo -S ls -lh $WEB_DIR | head -10"
else
    echo "⚠️  Nenhum arquivo encontrado no servidor"
fi

echo ""

# Verificar configuração do Nginx
echo "⚙️  Verificando configuração do Nginx..."
if sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "export SUDO_PASS='$PASSWORD'; echo \"\$SUDO_PASS\" | sudo -S test -f /etc/nginx/sites-available/lacosapp.com && echo 'OK' || echo 'NÃO EXISTE'"; then
    echo "✅ Configuração do Nginx encontrada"
    echo ""
    echo "📋 Configuração atual:"
    sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "export SUDO_PASS='$PASSWORD'; echo \"\$SUDO_PASS\" | sudo -S cat /etc/nginx/sites-available/lacosapp.com 2>/dev/null | grep -E 'server_name|root|listen' | head -5"
else
    echo "⚠️  Configuração do Nginx não encontrada"
fi

echo ""

# Verificar status do Nginx
echo "🔄 Verificando status do Nginx..."
NGINX_STATUS=$(sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "export SUDO_PASS='$PASSWORD'; echo \"\$SUDO_PASS\" | sudo -S systemctl is-active nginx 2>/dev/null || echo 'inactive'")
if [ "$NGINX_STATUS" = "active" ]; then
    echo "✅ Nginx está rodando"
else
    echo "⚠️  Nginx não está rodando"
fi

echo ""
echo "🌐 URLs para testar:"
echo "   https://$DOMAIN"
echo "   https://www.$DOMAIN"
echo ""
echo "📝 Para ver os logs do Nginx:"
echo "   ssh -p $PORT $USER@$SERVER 'sudo tail -f /var/log/nginx/lacosapp-error.log'"


