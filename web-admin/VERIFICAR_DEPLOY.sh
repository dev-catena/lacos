#!/bin/bash

# Script para verificar se o deploy foi realizado corretamente
SERVER="192.168.0.20"
USER="darley"
PASSWORD="yhvh77"
WEB_DIR="/var/www/web"
NGINX_CONFIG="/etc/nginx/sites-available/admin.lacosapp.com"

echo "🔍 Verificando deploy da aplicação web admin..."
echo ""

echo "1️⃣ Verificando se os arquivos foram copiados..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" "
    echo '📁 Conteúdo de $WEB_DIR:'
    ls -lah $WEB_DIR 2>/dev/null || echo '❌ Diretório não existe ou sem permissão'
    echo ''
    echo '📄 Verificando index.html:'
    if [ -f '$WEB_DIR/index.html' ]; then
        echo '✅ index.html encontrado'
        head -5 '$WEB_DIR/index.html'
    else
        echo '❌ index.html NÃO encontrado'
    fi
    echo ''
    echo '📦 Verificando assets:'
    if [ -d '$WEB_DIR/assets' ]; then
        echo '✅ Diretório assets encontrado'
        ls -lah '$WEB_DIR/assets' | head -5
    else
        echo '❌ Diretório assets NÃO encontrado'
    fi
"

echo ""
echo "2️⃣ Verificando permissões..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" "
    echo 'Permissões de $WEB_DIR:'
    ls -ld $WEB_DIR 2>/dev/null
    echo ''
    echo 'Dono dos arquivos:'
    ls -la $WEB_DIR | head -5
"

echo ""
echo "3️⃣ Verificando configuração do Nginx..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" "
    if [ -f '$NGINX_CONFIG' ]; then
        echo '✅ Arquivo de configuração encontrado'
        echo ''
        echo '📄 Conteúdo da configuração:'
        cat '$NGINX_CONFIG'
    else
        echo '❌ Arquivo de configuração NÃO encontrado'
    fi
    echo ''
    echo '🔗 Verificando link simbólico:'
    if [ -L '/etc/nginx/sites-enabled/admin.lacosapp.com' ]; then
        echo '✅ Link simbólico existe'
        ls -l /etc/nginx/sites-enabled/admin.lacosapp.com
    else
        echo '❌ Link simbólico NÃO existe'
    fi
"

echo ""
echo "4️⃣ Testando configuração do Nginx..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" "export SUDO_PASS='$PASSWORD'; echo \"\$SUDO_PASS\" | sudo -S nginx -t 2>&1"

echo ""
echo "5️⃣ Verificando status do Nginx..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" "export SUDO_PASS='$PASSWORD'; echo \"\$SUDO_PASS\" | sudo -S systemctl status nginx --no-pager -l | head -15"

echo ""
echo "6️⃣ Verificando logs de erro do Nginx..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" "
    echo 'Últimas 20 linhas do log de erro:'
    export SUDO_PASS='$PASSWORD'
    echo \"\$SUDO_PASS\" | sudo -S tail -20 /var/log/nginx/admin-lacosapp-error.log 2>/dev/null || echo 'Nenhum erro encontrado ainda'
"

echo ""
echo "7️⃣ Verificando se o domínio resolve corretamente..."
echo "IP do servidor: $SERVER"
nslookup admin.lacosapp.com 2>/dev/null || echo "⚠️  Não foi possível resolver o DNS (pode ser normal se não estiver configurado ainda)"

echo ""
echo "✅ Verificação concluída!"


