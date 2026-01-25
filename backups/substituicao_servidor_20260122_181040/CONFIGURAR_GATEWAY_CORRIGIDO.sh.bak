#!/bin/bash

# Script para configurar gateway.lacosapp.com
# Execute este script no servidor com: sudo bash CONFIGURAR_GATEWAY_CORRIGIDO.sh

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

# PASSO 1: Criar configuração HTTP inicial (sem SSL)
echo "📝 Criando configuração HTTP inicial..."
cat > $NGINX_SITES/$DOMAIN << 'NGINX_CONFIG_HTTP'
server {
    listen 80;
    listen [::]:80;
    server_name gateway.lacosapp.com;

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
NGINX_CONFIG_HTTP

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

echo "✅ Configuração HTTP inicial criada e ativa"
echo ""

# PASSO 2: Verificar se certbot está instalado
if ! command -v certbot &> /dev/null; then
    echo "📦 Instalando certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# PASSO 3: Obter certificado SSL
echo "🔒 Obtendo certificado SSL..."
echo "⚠️  Certifique-se de que o DNS gateway.lacosapp.com está apontando para este servidor!"
echo ""

certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@lacosapp.com --redirect

if [ $? -eq 0 ]; then
    echo "✅ Certificado SSL obtido com sucesso!"
    echo ""
    echo "🔍 Verificando configuração final..."
    nginx -t
    
    if [ $? -eq 0 ]; then
        systemctl reload nginx
        echo "✅ Nginx recarregado com sucesso!"
    else
        echo "⚠️  Erro na configuração após SSL. Verifique manualmente."
    fi
else
    echo "⚠️  Erro ao obter certificado SSL."
    echo ""
    echo "   Possíveis causas:"
    echo "   1. DNS gateway.lacosapp.com não está apontando para este servidor"
    echo "   2. Porta 80 não está aberta no firewall"
    echo "   3. Domínio já possui certificado em outro servidor"
    echo ""
    echo "   Você pode tentar novamente com:"
    echo "   certbot --nginx -d gateway.lacosapp.com"
    echo ""
    echo "   Ou configurar manualmente editando:"
    echo "   $NGINX_SITES/$DOMAIN"
fi

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📋 Resumo:"
echo "   - Domínio: http://$DOMAIN (redireciona para HTTPS se certificado foi obtido)"
echo "   - Endpoint: https://$DOMAIN/api/gateway/status"
echo "   - Configuração: $NGINX_SITES/$DOMAIN"
echo ""
echo "🧪 Teste o endpoint:"
echo "   curl http://$DOMAIN/api/gateway/status"
echo "   curl https://$DOMAIN/api/gateway/status"
echo ""












