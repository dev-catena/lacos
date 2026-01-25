#!/bin/bash

# Script para instalar funcionalidade de documentos no servidor

echo "📄 Instalando funcionalidade de Documentos..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configurações do servidor
SERVER="10.102.0.103"
USER="darley"
PASSWORD="yhvh77"
REMOTE_PATH="/var/www/lacos-backend"

echo -e "${YELLOW}1. Copiando arquivos para o servidor...${NC}"

# Copiar para home primeiro (sem necessidade de sudo)
sshpass -p "$PASSWORD" scp create_documents_table.php ${USER}@${SERVER}:~/create_documents_table.php
sshpass -p "$PASSWORD" scp Document.php ${USER}@${SERVER}:~/Document.php
sshpass -p "$PASSWORD" scp DocumentController.php ${USER}@${SERVER}:~/DocumentController.php
sshpass -p "$PASSWORD" scp api_routes_corrected.php ${USER}@${SERVER}:~/api_routes_corrected.php

echo -e "${YELLOW}2. Movendo arquivos para os diretórios corretos (requer sudo)...${NC}"

# Mover arquivos com sudo
sshpass -p "$PASSWORD" ssh ${USER}@${SERVER} << 'EOF'
echo "$PASSWORD" | sudo -S mv ~/create_documents_table.php /var/www/lacos-backend/database/migrations/$(date +%Y_%m_%d_%H%M%S)_create_documents_table.php
echo "$PASSWORD" | sudo -S mv ~/Document.php /var/www/lacos-backend/app/Models/Document.php
echo "$PASSWORD" | sudo -S mv ~/DocumentController.php /var/www/lacos-backend/app/Http/Controllers/Api/DocumentController.php
echo "$PASSWORD" | sudo -S mv ~/api_routes_corrected.php /var/www/lacos-backend/routes/api.php
echo "$PASSWORD" | sudo -S chown www-data:www-data /var/www/lacos-backend/app/Models/Document.php
echo "$PASSWORD" | sudo -S chown www-data:www-data /var/www/lacos-backend/app/Http/Controllers/Api/DocumentController.php
EOF

echo -e "${YELLOW}3. Executando migration no servidor...${NC}"

sshpass -p "$PASSWORD" ssh ${USER}@${SERVER} << EOF
cd ${REMOTE_PATH}
php artisan migrate --force
php artisan config:clear
php artisan cache:clear
php artisan route:clear
EOF

echo -e "${GREEN}✅ Documentos instalados com sucesso!${NC}"
echo -e "${GREEN}✅ Migration executada${NC}"
echo -e "${GREEN}✅ Cache limpo${NC}"

