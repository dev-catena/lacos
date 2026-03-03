#!/bin/bash

set -e

# Configurações do servidor
SERVER="192.168.0.20"
USER="darley"
PASSWORD="yhvh77"
PORT="63022"
DOMAIN="lacosapp.com"
WEB_DIR="/var/www/lacos-website"
NGINX_CONFIG="/etc/nginx/sites-available/lacosapp.com"
NGINX_ENABLED="/etc/nginx/sites-enabled/lacosapp.com"

echo "🚀 Iniciando deploy do site LaçosApp para $DOMAIN..."
echo "📍 Executando build local e deploy remoto via SSH..."
echo ""

# Determinar o diretório correto da aplicação
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$SCRIPT_DIR"

# Verificar se estamos no diretório correto
if [ ! -f "$APP_DIR/package.json" ]; then
    echo "❌ Erro: Execute este script no diretório website/"
    echo "   Diretório atual: $APP_DIR"
    exit 1
fi

# Mudar para o diretório da aplicação
cd "$APP_DIR"
echo "📁 Diretório da aplicação: $(pwd)"

# 1. Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# 2. Fazer build da aplicação
echo "🏗️  Fazendo build da aplicação React..."
npm run build

if [ ! -d "dist" ]; then
  echo "❌ Erro: Diretório 'dist' não foi criado após o build"
  exit 1
fi

echo "✅ Build concluído com sucesso!"
echo ""

# 3. Copiar arquivos para o servidor
echo "📤 Enviando arquivos para o servidor..."

# Criar diretório no servidor (com sudo)
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "export SUDO_PASS='$PASSWORD'; echo \"\$SUDO_PASS\" | sudo -S mkdir -p $WEB_DIR"

# Limpar diretório remoto (exceto backups se houver)
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "export SUDO_PASS='$PASSWORD'; echo \"\$SUDO_PASS\" | sudo -S rm -rf $WEB_DIR/*"

# Criar diretório temporário no servidor
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "mkdir -p /tmp/lacos-website-deploy && rm -rf /tmp/lacos-website-deploy/*"

# Enviar arquivos do build (compactar antes para transferir mais rápido)
cd dist
tar czf /tmp/lacos-website-build.tar.gz .
cd ..

echo "📤 Enviando arquivos compactados para o servidor..."
sshpass -p "$PASSWORD" scp -P "$PORT" -o StrictHostKeyChecking=no /tmp/lacos-website-build.tar.gz "$USER@$SERVER:/tmp/"

# Extrair e mover arquivos para o diretório final (com sudo)
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "
    export SUDO_PASS='$PASSWORD'
    cd /tmp && 
    tar xzf lacos-website-build.tar.gz -C /tmp/lacos-website-deploy/ && 
    echo \"\$SUDO_PASS\" | sudo -S rm -rf $WEB_DIR/* && 
    echo \"\$SUDO_PASS\" | sudo -S mv /tmp/lacos-website-deploy/* $WEB_DIR/ && 
    echo \"\$SUDO_PASS\" | sudo -S chown -R www-data:www-data $WEB_DIR && 
    echo \"\$SUDO_PASS\" | sudo -S chmod -R 755 $WEB_DIR && 
    rm -rf /tmp/lacos-website-deploy /tmp/lacos-website-build.tar.gz
"

# Limpar arquivo temporário local
rm -f /tmp/lacos-website-build.tar.gz

echo "✅ Arquivos enviados com sucesso!"
echo ""

# 4. Criar configuração do Nginx
echo "⚙️  Configurando Nginx..."

# Gerar configuração do Nginx (HTTP e HTTPS)
NGINX_CONF="server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    # Redirecionar HTTP para HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    root $WEB_DIR;
    index index.html;

    # Certificados SSL (ajustar caminhos se necessário)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Configurações SSL recomendadas
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Logs
    access_log /var/log/nginx/lacosapp-access.log;
    error_log /var/log/nginx/lacosapp-error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Cache estático
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
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

    # Headers de segurança
    add_header X-Frame-Options \"SAMEORIGIN\" always;
    add_header X-Content-Type-Options \"nosniff\" always;
    add_header X-XSS-Protection \"1; mode=block\" always;
}"

# Salvar configuração localmente temporariamente
echo "$NGINX_CONF" > /tmp/nginx-lacosapp.conf

# Enviar para o servidor
sshpass -p "$PASSWORD" scp -P "$PORT" -o StrictHostKeyChecking=no /tmp/nginx-lacosapp.conf "$USER@$SERVER:/tmp/nginx-lacosapp.conf"

# Criar arquivo de configuração no servidor (com sudo)
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "export SUDO_PASS='$PASSWORD'; echo \"\$SUDO_PASS\" | sudo -S mv /tmp/nginx-lacosapp.conf $NGINX_CONFIG"

# Criar link simbólico se não existir
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "export SUDO_PASS='$PASSWORD'; echo \"\$SUDO_PASS\" | sudo -S ln -sf $NGINX_CONFIG $NGINX_ENABLED"

# Limpar arquivo temporário local
rm -f /tmp/nginx-lacosapp.conf

# 5. Testar configuração do Nginx
echo "🧪 Testando configuração do Nginx..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "export SUDO_PASS='$PASSWORD'; echo \"\$SUDO_PASS\" | sudo -S nginx -t"

if [ $? -eq 0 ]; then
    echo "✅ Configuração do Nginx válida!"
    
    # Recarregar Nginx
    echo "🔄 Recarregando Nginx..."
    sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "export SUDO_PASS='$PASSWORD'; echo \"\$SUDO_PASS\" | sudo -S systemctl reload nginx"
    
    echo ""
    echo "✅ Deploy concluído com sucesso!"
    echo ""
    echo "🌐 O site está disponível em:"
    echo "   https://$DOMAIN"
    echo "   https://www.$DOMAIN"
    echo ""
    echo "📝 Verifique os logs se houver problemas:"
    echo "   sudo tail -f /var/log/nginx/lacosapp-error.log"
    echo ""
    echo "⚠️  Nota: Se os certificados SSL não estiverem configurados, ajuste o caminho dos certificados no arquivo:"
    echo "   $NGINX_CONFIG"
else
    echo "❌ Erro na configuração do Nginx!"
    echo ""
    echo "💡 Dica: Verifique se os certificados SSL estão configurados corretamente."
    echo "   Se não tiver certificados SSL, você pode usar Let's Encrypt:"
    echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    exit 1
fi


