#!/bin/bash

set -e

# Configurações do servidor
SERVER="10.102.0.103"
USER="darley"
PASSWORD="yhvh77"
PORT="63022"
DOMAIN="admin.lacosapp.com"
WEB_DIR="/var/www/web"
NGINX_CONFIG="/etc/nginx/sites-available/admin.lacosapp.com"
NGINX_ENABLED="/etc/nginx/sites-enabled/admin.lacosapp.com"

echo "🚀 Iniciando deploy da aplicação web admin para $DOMAIN..."
echo "📍 Executando build local e deploy remoto via SSH..."
echo ""

# Determinar o diretório correto da aplicação
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$SCRIPT_DIR"

# Se o script está em /tmp ou outro lugar, tentar diretórios padrão
if [ ! -f "$APP_DIR/package.json" ]; then
    # Tentar diferentes caminhos possíveis
    POSSIBLE_DIRS=(
        "/home/darley/lacos/web"
        "/var/www/web"
        "/var/www/lacos-backend/web"
        "/var/www/lacos-backend"
        "/var/www/lacos/web"
        "/root/lacos/web"
        "/root/web"
    )
    
    FOUND=false
    for dir in "${POSSIBLE_DIRS[@]}"; do
        if [ -f "$dir/package.json" ]; then
            APP_DIR="$dir"
            echo "⚠️  Script executado fora do diretório da aplicação. Usando: $APP_DIR"
            FOUND=true
            break
        fi
    done
    
    if [ "$FOUND" = false ]; then
        echo "❌ Erro: Não foi possível encontrar package.json"
        echo "   Procurando em: $APP_DIR"
        echo "   Caminhos tentados:"
        for dir in "${POSSIBLE_DIRS[@]}"; do
            echo "     - $dir"
        done
        echo "   Execute o script a partir do diretório da aplicação React ou coloque o código fonte em um dos caminhos acima"
        exit 1
    fi
fi

# Mudar para o diretório da aplicação
cd "$APP_DIR"
echo "📁 Diretório da aplicação: $(pwd)"

# 1. Fazer build da aplicação
echo "📦 Fazendo build da aplicação React..."
npm install --production=false
npm run build

if [ ! -d "dist" ]; then
  echo "❌ Erro: Diretório 'dist' não foi criado após o build"
  exit 1
fi

echo "✅ Build concluído com sucesso!"
echo ""

# 2. Copiar arquivos para o servidor
echo "📤 Enviando arquivos para o servidor..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "export SUDO_PASS='$PASSWORD'; echo \"\$SUDO_PASS\" | sudo -S mkdir -p $WEB_DIR"

# Limpar diretório remoto (exceto backups se houver)
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "export SUDO_PASS='$PASSWORD'; echo \"\$SUDO_PASS\" | sudo -S rm -rf $WEB_DIR/*"

# Criar diretório temporário no servidor
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "mkdir -p /tmp/lacos-app-deploy && rm -rf /tmp/lacos-app-deploy/*"

# Enviar arquivos do build (compactar antes para transferir mais rápido)
cd dist
tar czf /tmp/lacos-app-build.tar.gz .
cd ..

echo "📤 Enviando arquivos para o servidor..."
sshpass -p "$PASSWORD" scp -P "$PORT" -o StrictHostKeyChecking=no /tmp/lacos-app-build.tar.gz "$USER@$SERVER:/tmp/"

# Extrair e mover arquivos para o diretório final (com sudo)
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "
    export SUDO_PASS='$PASSWORD'
    cd /tmp && 
    tar xzf lacos-app-build.tar.gz -C /tmp/lacos-app-deploy/ && 
    echo \"\$SUDO_PASS\" | sudo -S rm -rf $WEB_DIR/* && 
    echo \"\$SUDO_PASS\" | sudo -S mv /tmp/lacos-app-deploy/* $WEB_DIR/ && 
    echo \"\$SUDO_PASS\" | sudo -S chown -R www-data:www-data $WEB_DIR && 
    echo \"\$SUDO_PASS\" | sudo -S chmod -R 755 $WEB_DIR && 
    rm -rf /tmp/lacos-app-deploy /tmp/lacos-app-build.tar.gz
"

# Limpar arquivo temporário local
rm -f /tmp/lacos-app-build.tar.gz

echo "✅ Arquivos enviados com sucesso!"
echo ""

# 3. Criar configuração do Nginx
echo "⚙️  Configurando Nginx..."

# Gerar configuração do Nginx
NGINX_CONF="server {
    listen 80;
    server_name $DOMAIN;

    root $WEB_DIR;
    index index.html;

    # Logs
    access_log /var/log/nginx/admin-lacosapp-access.log;
    error_log /var/log/nginx/admin-lacosapp-error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Cache estático
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
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

# Salvar configuração localmente temporariamente
echo "$NGINX_CONF" > /tmp/nginx-admin-lacosapp.conf

# Enviar para o servidor
sshpass -p "$PASSWORD" scp -P "$PORT" -o StrictHostKeyChecking=no /tmp/nginx-admin-lacosapp.conf "$USER@$SERVER:/tmp/nginx-admin-lacosapp.conf"

# Criar arquivo de configuração no servidor (com sudo)
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "export SUDO_PASS='$PASSWORD'; echo \"\$SUDO_PASS\" | sudo -S mv /tmp/nginx-admin-lacosapp.conf $NGINX_CONFIG"

# Criar link simbólico se não existir
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" "export SUDO_PASS='$PASSWORD'; echo \"\$SUDO_PASS\" | sudo -S ln -sf $NGINX_CONFIG $NGINX_ENABLED"

# Limpar arquivo temporário local
rm -f /tmp/nginx-admin-lacosapp.conf

# 4. Testar configuração do Nginx
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
    echo "🌐 A aplicação está disponível em:"
    echo "   http://$DOMAIN"
    echo ""
    echo "📝 Verifique os logs se houver problemas:"
    echo "   sudo tail -f /var/log/nginx/admin-lacosapp-error.log"
else
    echo "❌ Erro na configuração do Nginx!"
    exit 1
fi

