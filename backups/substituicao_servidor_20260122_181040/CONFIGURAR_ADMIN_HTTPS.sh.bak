#!/bin/bash

# Script para configurar HTTPS para admin.lacosapp.com
# Execute este script no servidor com: sudo bash CONFIGURAR_ADMIN_HTTPS.sh

DOMAIN="admin.lacosapp.com"
NGINX_SITES="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
WEB_DIR="/var/www/web"

echo "🔧 Configurando HTTPS para $DOMAIN..."
echo ""

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Este script precisa ser executado com sudo!"
    echo "   Execute: sudo bash $0"
    exit 1
fi

# Verificar se Nginx está instalado
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx não está instalado!"
    exit 1
fi

# Verificar se o diretório web existe
if [ ! -d "$WEB_DIR" ]; then
    echo "❌ Diretório $WEB_DIR não encontrado!"
    echo "   Verifique se o diretório existe e tente novamente."
    exit 1
fi

echo "✅ Diretório web encontrado: $WEB_DIR"

# Verificar se já existe configuração
if [ -f "$NGINX_SITES/$DOMAIN" ]; then
    echo "📋 Configuração existente encontrada. Fazendo backup..."
    cp $NGINX_SITES/$DOMAIN $NGINX_SITES/$DOMAIN.bak.$(date +%Y%m%d_%H%M%S)
fi

# Verificar se certbot está instalado
if ! command -v certbot &> /dev/null; then
    echo "📦 Instalando certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Verificar se já existe certificado SSL
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "✅ Certificado SSL já existe para $DOMAIN"
    echo "🔄 Atualizando configuração do Nginx para usar HTTPS..."
    
    # Criar configuração com HTTPS
    cat > $NGINX_SITES/$DOMAIN << NGINX_CONFIG_HTTPS
server {
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
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logs
    access_log /var/log/nginx/admin-lacosapp-access.log;
    error_log /var/log/nginx/admin-lacosapp-error.log;

    # Root e index
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
        add_header Cache-Control "public, immutable";
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
}
NGINX_CONFIG_HTTPS

else
    echo "📝 Criando configuração HTTP inicial..."
    
    # Criar configuração HTTP inicial (sem SSL)
    cat > $NGINX_SITES/$DOMAIN << NGINX_CONFIG_HTTP
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # Logs
    access_log /var/log/nginx/admin-lacosapp-access.log;
    error_log /var/log/nginx/admin-lacosapp-error.log;

    # Root e index
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
        add_header Cache-Control "public, immutable";
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
}
NGINX_CONFIG_HTTP
fi

# Criar link simbólico
echo "🔗 Criando link simbólico..."
ln -sf $NGINX_SITES/$DOMAIN $NGINX_ENABLED/$DOMAIN

# Testar configuração do Nginx
echo "🧪 Testando configuração do Nginx..."
nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Erro na configuração do Nginx!"
    exit 1
fi

# Recarregar Nginx
echo "🔄 Recarregando Nginx..."
systemctl reload nginx

# Se não existe certificado, obter um
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "🔒 Obtendo certificado SSL para $DOMAIN..."
    echo "⚠️  Certifique-se de que o DNS $DOMAIN está apontando para este servidor!"
    echo ""
    
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@lacosapp.com --redirect
    
    if [ $? -eq 0 ]; then
        echo "✅ Certificado SSL obtido com sucesso!"
    else
        echo "⚠️  Erro ao obter certificado SSL."
        echo ""
        echo "   Possíveis causas:"
        echo "   1. DNS $DOMAIN não está apontando para este servidor"
        echo "   2. Porta 80 não está aberta no firewall"
        echo "   3. Domínio já possui certificado em outro servidor"
        echo ""
        echo "   Você pode tentar novamente com:"
        echo "   certbot --nginx -d $DOMAIN"
    fi
else
    echo "✅ Certificado SSL já existe. Configuração atualizada."
fi

# Verificar configuração final
echo ""
echo "🔍 Verificando configuração final..."
nginx -t

if [ $? -eq 0 ]; then
    systemctl reload nginx
    echo "✅ Nginx recarregado com sucesso!"
else
    echo "⚠️  Erro na configuração. Verifique manualmente."
fi

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📋 Resumo:"
echo "   - Domínio: https://$DOMAIN"
echo "   - Diretório web: $WEB_DIR"
echo "   - Configuração: $NGINX_SITES/$DOMAIN"
echo ""
echo "🧪 Teste o acesso:"
echo "   curl -I http://$DOMAIN"
echo "   curl -I https://$DOMAIN"
echo ""

