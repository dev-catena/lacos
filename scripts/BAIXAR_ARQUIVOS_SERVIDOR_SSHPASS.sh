#!/bin/bash

# Script para baixar controllers, models e migrations do servidor usando sshpass

SERVER="darley@10.102.0.103"
PORT="63022"
PASSWORD="Lacos2025Secure"
REMOTE_PATH="/var/www/lacos-backend"
LOCAL_PATH="/home/darley/lacos/backend-laravel"
TEMP_DIR="/tmp/lacos_backup_$$"

# Verificar se sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass não está instalado. Instalando..."
    sudo apt-get update && sudo apt-get install -y sshpass
fi

echo "🔍 Conectando ao servidor e criando backup temporário..."

# Criar diretório temporário no servidor e copiar arquivos
sshpass -p "$PASSWORD" ssh -p $PORT -o StrictHostKeyChecking=no darley@10.102.0.103 << 'ENDSSH'
mkdir -p /tmp/lacos_backup_$$
cd /var/www/lacos-backend

# Copiar controllers
mkdir -p /tmp/lacos_backup_$$/app/Http/Controllers
find app/Http/Controllers -name '*.php' -type f -exec cp --parents {} /tmp/lacos_backup_$$/ \;

# Copiar models
mkdir -p /tmp/lacos_backup_$$/app/Models
find app/Models -name '*.php' -type f -exec cp --parents {} /tmp/lacos_backup_$$/ \;

# Copiar migrations
mkdir -p /tmp/lacos_backup_$$/database/migrations
find database/migrations -name '*.php' -type f -exec cp --parents {} /tmp/lacos_backup_$$/ \;

# Criar arquivo tar
cd /tmp/lacos_backup_$$
tar -czf /tmp/lacos_backup.tar.gz app database
rm -rf /tmp/lacos_backup_$$
ENDSSH

if [ $? -ne 0 ]; then
    echo "❌ Erro ao criar backup no servidor"
    exit 1
fi

echo "✅ Backup criado no servidor"
echo "📥 Baixando arquivos..."

# Baixar o arquivo tar
sshpass -p "$PASSWORD" scp -P $PORT -o StrictHostKeyChecking=no darley@10.102.0.103:/tmp/lacos_backup.tar.gz /tmp/lacos_backup.tar.gz

if [ $? -ne 0 ]; then
    echo "❌ Erro ao baixar arquivo do servidor"
    exit 1
fi

echo "✅ Arquivo baixado"
echo "📦 Extraindo arquivos..."

# Extrair arquivos
cd /tmp
tar -xzf lacos_backup.tar.gz

# Copiar para o projeto local
echo "📋 Copiando arquivos para o projeto local..."

# Copiar controllers
if [ -d "app/Http/Controllers" ]; then
    mkdir -p "$LOCAL_PATH/app/Http/Controllers"
    cp -r app/Http/Controllers/* "$LOCAL_PATH/app/Http/Controllers/" 2>/dev/null
    echo "  ✅ Controllers copiados"
fi

# Copiar models
if [ -d "app/Models" ]; then
    mkdir -p "$LOCAL_PATH/app/Models"
    cp -r app/Models/* "$LOCAL_PATH/app/Models/" 2>/dev/null
    echo "  ✅ Models copiados"
fi

# Copiar migrations
if [ -d "database/migrations" ]; then
    mkdir -p "$LOCAL_PATH/database/migrations"
    cp -r database/migrations/* "$LOCAL_PATH/database/migrations/" 2>/dev/null
    echo "  ✅ Migrations copiadas"
fi

# Limpar arquivos temporários
rm -rf /tmp/app /tmp/database /tmp/lacos_backup.tar.gz
sshpass -p "$PASSWORD" ssh -p $PORT -o StrictHostKeyChecking=no darley@10.102.0.103 "rm -f /tmp/lacos_backup.tar.gz" 2>/dev/null

echo ""
echo "✅ Sincronização concluída!"





