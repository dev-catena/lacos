#!/bin/bash

echo "🔧 Configurando gateway.lacosapp.com no Nginx..."
echo ""

# Variáveis
SERVER_IP="192.168.0.20"
SERVER_USER="darley"
SERVER_PASSWORD="yhvh77"
DOMAIN="gateway.lacosapp.com"
BACKEND_PATH="/var/www/lacos-backend"

# Instalar sshpass se não estiver instalado
if ! command -v sshpass &> /dev/null; then
    echo "📦 Instalando sshpass..."
    sudo apt-get update && sudo apt-get install -y sshpass
fi

# Criar configuração do Nginx
cat > /tmp/gateway_nginx.conf << 'NGINX_CONFIG'
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

echo "📝 Configuração do Nginx criada"
echo ""

# Copiar configuração para o servidor
echo "📤 Copiando configuração para o servidor..."
sshpass -p "$SERVER_PASSWORD" scp -P 63022 -o StrictHostKeyChecking=no /tmp/gateway_nginx.conf $SERVER_USER@$SERVER_IP:/tmp/gateway_nginx.conf

echo "✅ Configuração copiada"
echo ""

# Script para executar no servidor
cat > /tmp/configurar_gateway_servidor.sh << 'SERVER_SCRIPT'
#!/bin/bash

DOMAIN="gateway.lacosapp.com"
NGINX_CONFIG="/tmp/gateway_nginx.conf"
NGINX_SITES="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

echo "🔧 Configurando gateway no servidor..."
echo ""

# Verificar se Nginx está instalado
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx não está instalado!"
    exit 1
fi

# Verificar se certbot está instalado
if ! command -v certbot &> /dev/null; then
    echo "📦 Instalando certbot..."
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
fi

# Copiar configuração do Nginx
echo "📝 Copiando configuração do Nginx..."
sudo cp $NGINX_CONFIG $NGINX_SITES/$DOMAIN

# Criar link simbólico
echo "🔗 Criando link simbólico..."
sudo ln -sf $NGINX_SITES/$DOMAIN $NGINX_ENABLED/$DOMAIN

# Testar configuração do Nginx
echo "🧪 Testando configuração do Nginx..."
sudo nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Erro na configuração do Nginx!"
    exit 1
fi

# Recarregar Nginx
echo "🔄 Recarregando Nginx..."
sudo systemctl reload nginx

# Obter certificado SSL
echo "🔒 Obtendo certificado SSL..."
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@lacosapp.com --redirect

if [ $? -eq 0 ]; then
    echo "✅ Certificado SSL obtido com sucesso!"
else
    echo "⚠️ Erro ao obter certificado SSL. Verifique se o DNS está apontando corretamente."
fi

# Recarregar Nginx novamente
sudo systemctl reload nginx

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
SERVER_SCRIPT

# Copiar script para o servidor
echo "📤 Copiando script para o servidor..."
sshpass -p "$SERVER_PASSWORD" scp -P 63022 -o StrictHostKeyChecking=no /tmp/configurar_gateway_servidor.sh $SERVER_USER@$SERVER_IP:/tmp/configurar_gateway_servidor.sh

echo "✅ Script copiado"
echo ""

# Executar script no servidor
echo "🚀 Executando configuração no servidor..."
sshpass -p "$SERVER_PASSWORD" ssh -p 63022 -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "chmod +x /tmp/configurar_gateway_servidor.sh && bash /tmp/configurar_gateway_servidor.sh"

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Verifique se o DNS está apontando corretamente:"
echo "      dig gateway.lacosapp.com"
echo ""
echo "   2. Teste o endpoint:"
echo "      curl https://gateway.lacosapp.com/api/gateway/status"
echo ""
echo "   3. Se o certificado SSL não foi gerado automaticamente, execute:"
echo "      sudo certbot --nginx -d gateway.lacosapp.com"












