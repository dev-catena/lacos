#!/bin/bash

# Script para atualizar UserController com processamento de cursos
# Servidor: 192.168.0.20
# Usuário: darley
# Senha: yhvh77

echo "🔧 Atualizando UserController com processamento de cursos..."

# Configurações
SERVER="darley@192.168.0.20"
SERVER_PATH="/var/www/lacos-backend"
LOCAL_FILE="UserController_COM_DOENCAS_ALERGIAS.php"
REMOTE_FILE="app/Http/Controllers/Api/UserController.php"

# Verificar se o arquivo local existe
if [ ! -f "$LOCAL_FILE" ]; then
    echo "❌ Arquivo local não encontrado: $LOCAL_FILE"
    exit 1
fi

# Copiar arquivo para o servidor
echo "📤 Copiando arquivo para o servidor..."
sshpass -p 'yhvh77' scp "$LOCAL_FILE" "$SERVER:/tmp/UserController_NOVO.php"

# Executar comandos no servidor
echo "🔧 Aplicando alterações no servidor..."
sshpass -p 'yhvh77' ssh "$SERVER" bash << 'ENDSSH'
cd /var/www/lacos-backend

# Criar backup
echo "📦 Criando backup..."
echo 'yhvh77' | sudo -S cp app/Http/Controllers/Api/UserController.php app/Http/Controllers/Api/UserController.php.bak.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# Copiar novo arquivo
echo "📝 Copiando novo controller..."
echo 'yhvh77' | sudo -S cp /tmp/UserController_NOVO.php app/Http/Controllers/Api/UserController.php 2>/dev/null
echo 'yhvh77' | sudo -S chown www-data:www-data app/Http/Controllers/Api/UserController.php 2>/dev/null

# Verificar sintaxe PHP
echo "🔍 Verificando sintaxe PHP..."
php -l app/Http/Controllers/Api/UserController.php

# Limpar cache
echo "🧹 Limpando cache..."
php artisan optimize:clear
php artisan route:clear
php artisan config:clear
php artisan cache:clear

echo "✅ UserController atualizado com sucesso!"
ENDSSH

echo "✅ Concluído!"

