#!/bin/bash

# Script para instalar funcionalidade de documentos no servidor

echo "📄 Instalando funcionalidade de Documentos..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configurações do servidor
SERVER="193.203.182.22"
USER="darley"
PASSWORD="yhvh77"
REMOTE_PATH="/var/www/lacos-backend"

echo -e "${YELLOW}1. Copiando arquivos para o servidor...${NC}"

# Copiar para home primeiro (sem necessidade de sudo)
sshpass -p "$PASSWORD" scp create_documents_table.php ${USER}@${SERVER}:~/create_documents_table.php
sshpass -p "$PASSWORD" scp Document.php ${USER}@${SERVER}:~/Document.php
sshpass -p "$PASSWORD" scp DocumentController.php ${USER}@${SERVER}:~/DocumentController.php
sshpass -p "$PASSWORD" scp api_routes_corrected.php ${USER}@${SERVER}:~/api_routes_corrected.php

echo -e "${YELLOW}2. Movendo arquivos para os diretórios corretos...${NC}"
echo -e "${RED}⚠️  Você precisará executar os seguintes comandos manualmente no servidor:${NC}"
echo ""
echo "ssh ${USER}@${SERVER}"
echo "echo 'yhvh77' | sudo -S mv ~/create_documents_table.php ${REMOTE_PATH}/database/migrations/\$(date +%Y_%m_%d_%H%M%S)_create_documents_table.php"
echo "echo 'yhvh77' | sudo -S mv ~/Document.php ${REMOTE_PATH}/app/Models/Document.php"
echo "echo 'yhvh77' | sudo -S mv ~/DocumentController.php ${REMOTE_PATH}/app/Http/Controllers/Api/DocumentController.php"
echo "echo 'yhvh77' | sudo -S mv ~/api_routes_corrected.php ${REMOTE_PATH}/routes/api.php"
echo "echo 'yhvh77' | sudo -S chown www-data:www-data ${REMOTE_PATH}/app/Models/Document.php"
echo "echo 'yhvh77' | sudo -S chown www-data:www-data ${REMOTE_PATH}/app/Http/Controllers/Api/DocumentController.php"
echo "cd ${REMOTE_PATH}"
echo "php artisan migrate --force"
echo "php artisan config:clear"
echo "php artisan cache:clear"
echo "php artisan route:clear"
echo ""
echo -e "${GREEN}✅ Arquivos copiados para ~/ no servidor${NC}"
echo -e "${YELLOW}Execute os comandos acima no servidor para completar a instalação${NC}"







