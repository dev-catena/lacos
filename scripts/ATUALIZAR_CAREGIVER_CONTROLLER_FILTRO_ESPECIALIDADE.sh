#!/bin/bash

# Script para atualizar CaregiverController com filtro por especialidade e disponibilidade
# Servidor: 193.203.182.22
# Usuário: darley
# Senha: yhvh77

echo "🔧 Atualizando CaregiverController com filtros de especialidade e disponibilidade..."

# Configurações
SERVER="darley@193.203.182.22"
SERVER_PATH="/var/www/lacos-backend"
LOCAL_FILE="CaregiverController_COM_FILTRO_ESPECIALIDADE.php"
REMOTE_FILE="app/Http/Controllers/Api/CaregiverController.php"

# Verificar se o arquivo local existe
if [ ! -f "$LOCAL_FILE" ]; then
    echo "❌ Arquivo local não encontrado: $LOCAL_FILE"
    exit 1
fi

# Copiar arquivo para o servidor
echo "📤 Copiando arquivo para o servidor..."
sshpass -p 'yhvh77' scp "$LOCAL_FILE" "$SERVER:/tmp/CaregiverController_NOVO.php"

# Executar comandos no servidor
echo "🔧 Aplicando alterações no servidor..."
sshpass -p 'yhvh77' ssh "$SERVER" bash << 'ENDSSH'
cd /var/www/lacos-backend

# Criar backup
echo "📦 Criando backup..."
echo 'yhvh77' | sudo -S cp app/Http/Controllers/Api/CaregiverController.php app/Http/Controllers/Api/CaregiverController.php.bak.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# Copiar novo arquivo
echo "📝 Copiando novo controller..."
echo 'yhvh77' | sudo -S cp /tmp/CaregiverController_NOVO.php app/Http/Controllers/Api/CaregiverController.php 2>/dev/null
echo 'yhvh77' | sudo -S chown www-data:www-data app/Http/Controllers/Api/CaregiverController.php 2>/dev/null

# Verificar sintaxe PHP
echo "🔍 Verificando sintaxe PHP..."
php -l app/Http/Controllers/Api/CaregiverController.php

# Limpar cache
echo "🧹 Limpando cache..."
php artisan optimize:clear
php artisan route:clear
php artisan config:clear
php artisan cache:clear

echo "✅ CaregiverController atualizado com sucesso!"
ENDSSH

echo "✅ Concluído!"

