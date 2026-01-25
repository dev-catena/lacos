#!/bin/bash

# Script para corrigir configuração do Nginx para admin.lacosapp.com
# Aponta para /var/www/web ao invés do Laravel

set -e

# Configurações do servidor
SERVER="193.203.182.22"
USER="darley"
PASSWORD="yhvh77"
PORT="63022"
DOMAIN="admin.lacosapp.com"
WEB_DIR="/var/www/web"
NGINX_CONFIG="/etc/nginx/sites-available/admin.lacosapp.com"
NGINX_ENABLED="/etc/nginx/sites-enabled/admin.lacosapp.com"

echo "🔧 Corrigindo configuração do Nginx para $DOMAIN..."
echo "📍 Servidor: $SERVER:$PORT"
echo "📁 Diretório web: $WEB_DIR"
echo ""

# Verificar se o diretório web existe no servidor
echo "1️⃣ Verificando se o diretório $WEB_DIR existe no servidor..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "
    if [ ! -d '$WEB_DIR' ]; then
        echo '❌ Diretório $WEB_DIR não existe!'
        exit 1
    fi
    echo '✅ Diretório encontrado'
    ls -la $WEB_DIR | head -5
"

if [ $? -ne 0 ]; then
    echo "❌ Erro ao verificar diretório no servidor"
    exit 1
fi

echo ""
echo "2️⃣ Verificando configuração atual do Nginx..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "echo '$PASSWORD' | sudo -S cat $NGINX_CONFIG 2>/dev/null | grep -E 'root|server_name|listen' | head -10 || echo '⚠️  Arquivo de configuração não existe ou não acessível'"

echo ""
echo "3️⃣ Criando nova configuração do Nginx..."

# Verificar se existe certificado SSL
HAS_SSL=$(sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "echo '$PASSWORD' | sudo -S test -d '/etc/letsencrypt/live/$DOMAIN' && echo 'yes' || echo 'no'")

if [ "$HAS_SSL" = "yes" ]; then
    echo "✅ Certificado SSL encontrado. Criando configuração HTTPS..."
    
    NGINX_CONF="server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # Redirecionar HTTP para HTTPS
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN;

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Headers de segurança
    add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains\" always;
    add_header X-Frame-Options \"SAMEORIGIN\" always;
    add_header X-Content-Type-Options \"nosniff\" always;
    add_header X-XSS-Protection \"1; mode=block\" always;

    # Logs
    access_log /var/log/nginx/admin-lacosapp-access.log;
    error_log /var/log/nginx/admin-lacosapp-error.log;

    # Root e index - CORRIGIDO para /var/www/web
    root $WEB_DIR;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Cache estático
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }

    # SPA: todas as rotas apontam para index.html
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Segurança: não permitir acesso a arquivos ocultos
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}"
else
    echo "⚠️  Certificado SSL não encontrado. Criando configuração HTTP..."
    
    NGINX_CONF="server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # Logs
    access_log /var/log/nginx/admin-lacosapp-access.log;
    error_log /var/log/nginx/admin-lacosapp-error.log;

    # Root e index - CORRIGIDO para /var/www/web
    root $WEB_DIR;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Cache estático
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }

    # SPA: todas as rotas apontam para index.html
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Segurança: não permitir acesso a arquivos ocultos
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}"
fi

# Salvar configuração localmente temporariamente
echo "$NGINX_CONF" > /tmp/nginx-admin-lacosapp-fixed.conf

# Fazer backup da configuração atual
echo "💾 Fazendo backup da configuração atual..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "echo '$PASSWORD' | sudo -S cp $NGINX_CONFIG ${NGINX_CONFIG}.bak.\$(date +%Y%m%d_%H%M%S) 2>/dev/null && echo '✅ Backup criado' || echo '⚠️  Não foi possível criar backup (arquivo pode não existir)'"

# Enviar nova configuração para o servidor
echo "📤 Enviando nova configuração para o servidor..."
sshpass -p "$PASSWORD" scp -P "$PORT" -o StrictHostKeyChecking=no /tmp/nginx-admin-lacosapp-fixed.conf "$USER@$SERVER:/tmp/nginx-admin-lacosapp-fixed.conf"

# Mover para o local correto (com sudo)
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "echo '$PASSWORD' | sudo -S mv /tmp/nginx-admin-lacosapp-fixed.conf $NGINX_CONFIG && echo '$PASSWORD' | sudo -S chown root:root $NGINX_CONFIG && echo '$PASSWORD' | sudo -S chmod 644 $NGINX_CONFIG && echo '✅ Arquivo movido e permissões configuradas'"

# Criar link simbólico se não existir
echo "🔗 Criando link simbólico..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "echo '$PASSWORD' | sudo -S ln -sf $NGINX_CONFIG $NGINX_ENABLED && echo '✅ Link simbólico criado'"

# Limpar arquivo temporário local
rm -f /tmp/nginx-admin-lacosapp-fixed.conf

echo ""
echo "4️⃣ Testando configuração do Nginx..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "echo '$PASSWORD' | sudo -S nginx -t"

if [ $? -eq 0 ]; then
    echo "✅ Configuração do Nginx válida!"
    
    echo ""
    echo "5️⃣ Recarregando Nginx..."
    sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "echo '$PASSWORD' | sudo -S systemctl reload nginx && echo '✅ Nginx recarregado'"
    
    echo ""
    echo "✅ Configuração corrigida com sucesso!"
    echo ""
    echo "📋 Resumo:"
    echo "   - Domínio: https://$DOMAIN"
    echo "   - Diretório web: $WEB_DIR"
    echo "   - Configuração: $NGINX_CONFIG"
    echo ""
    echo "🧪 Teste o acesso:"
    echo "   curl -I https://$DOMAIN"
    echo "   curl -I http://$DOMAIN"
    echo ""
    echo "📝 Verifique os logs se houver problemas:"
    echo "   sudo tail -f /var/log/nginx/admin-lacosapp-error.log"
else
    echo "❌ Erro na configuração do Nginx!"
    echo "   Verifique os erros acima e corrija manualmente"
    exit 1
fi

