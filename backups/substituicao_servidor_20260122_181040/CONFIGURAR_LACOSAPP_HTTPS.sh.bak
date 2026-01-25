#!/bin/bash

# Script para configurar HTTPS para lacosapp.com
# Execute este script no servidor com: sudo bash CONFIGURAR_LACOSAPP_HTTPS.sh

DOMAIN="lacosapp.com"
NGINX_SITES="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
BACKEND_PATH="/var/www/lacos-backend"

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
    server_name $DOMAIN www.$DOMAIN;

    # Redirecionar HTTP para HTTPS
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

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
    access_log /var/log/nginx/lacosapp_access.log;
    error_log /var/log/nginx/lacosapp_error.log;

    # Root e index
    root /var/www/lacos-backend/public;
    index index.php index.html;

    # Configuração do Laravel
    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    # PHP-FPM
    location ~ \.php\$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    # Bloquear acesso a arquivos sensíveis
    location ~ /\. {
        deny all;
    }

    # Cache para assets estáticos
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
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
    server_name $DOMAIN www.$DOMAIN;

    # Logs
    access_log /var/log/nginx/lacosapp_access.log;
    error_log /var/log/nginx/lacosapp_error.log;

    # Root e index
    root /var/www/lacos-backend/public;
    index index.php index.html;

    # Configuração do Laravel
    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    # PHP-FPM
    location ~ \.php\$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    # Bloquear acesso a arquivos sensíveis
    location ~ /\. {
        deny all;
    }

    # Cache para assets estáticos
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
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
    echo "🔒 Obtendo certificado SSL para $DOMAIN e www.$DOMAIN..."
    echo "⚠️  Certifique-se de que o DNS $DOMAIN está apontando para este servidor!"
    echo ""
    
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@lacosapp.com --redirect
    
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
        echo "   certbot --nginx -d $DOMAIN -d www.$DOMAIN"
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
echo "   - www: https://www.$DOMAIN"
echo "   - Configuração: $NGINX_SITES/$DOMAIN"
echo ""
echo "🧪 Teste os endpoints:"
echo "   curl http://$DOMAIN/api/gateway/status"
echo "   curl https://$DOMAIN/api/gateway/status"
echo ""












