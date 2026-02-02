#!/bin/bash

# Script para configurar gateway.lacosapp.com
# Execute este script no servidor com: sudo bash CONFIGURAR_GATEWAY_MANUAL.sh

DOMAIN="gateway.lacosapp.com"
NGINX_SITES="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔧 Configurando gateway.lacosapp.com no Nginx..."
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

# Criar configuração do Nginx
cat > $NGINX_SITES/$DOMAIN << 'NGINX_CONFIG'
server {
    listen 80;
    listen [::]:80;
    server_name gateway.lacosapp.com;

    # Redirecionar HTTP para HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name gateway.lacosapp.com;

    # Certificados SSL (serão gerados pelo certbot)
    ssl_certificate /etc/letsencrypt/live/gateway.lacosapp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gateway.lacosapp.com/privkey.pem;

    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logs
    access_log /var/log/nginx/gateway_access.log;
    error_log /var/log/nginx/gateway_error.log;

    # Root e index
    root /var/www/lacos-backend/public;
    index index.php index.html;

    # Configuração do Laravel
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP-FPM
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    # Bloquear acesso a arquivos sensíveis
    location ~ /\. {
        deny all;
    }

    # Cache para assets estáticos
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_CONFIG

echo "✅ Configuração do Nginx criada em $NGINX_SITES/$DOMAIN"

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

# Verificar se certbot está instalado
if ! command -v certbot &> /dev/null; then
    echo "📦 Instalando certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Obter certificado SSL
echo "🔒 Obtendo certificado SSL..."
echo "⚠️  Certifique-se de que o DNS gateway.lacosapp.com está apontando para este servidor!"
echo ""
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@lacosapp.com --redirect

if [ $? -eq 0 ]; then
    echo "✅ Certificado SSL obtido com sucesso!"
else
    echo "⚠️  Erro ao obter certificado SSL."
    echo "   Verifique se:"
    echo "   1. O DNS gateway.lacosapp.com está apontando para este servidor"
    echo "   2. A porta 80 está aberta no firewall"
    echo ""
    echo "   Você pode tentar novamente com:"
    echo "   certbot --nginx -d gateway.lacosapp.com"
fi

# Recarregar Nginx novamente
systemctl reload nginx

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📋 Resumo:"
echo "   - Domínio: https://$DOMAIN"
echo "   - Endpoint: https://$DOMAIN/api/gateway/status"
echo "   - Configuração: $NGINX_SITES/$DOMAIN"
echo ""
echo "🧪 Teste o endpoint:"
echo "   curl https://$DOMAIN/api/gateway/status"
echo ""












