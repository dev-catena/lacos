#!/bin/bash

# Script para atualizar AppointmentController e Appointment Model
# Servidor: 192.168.0.20
# Usuário: darley
# Senha: yhvh77

echo "🔧 Atualizando AppointmentController e Appointment Model..."

# Configurações
SERVER="darley@192.168.0.20"
SERVER_PATH="/var/www/lacos-backend"
LOCAL_CONTROLLER="AppointmentController_CORRIGIDO.php"
LOCAL_MODEL="Appointment_MODEL_CORRIGIDO.php"
REMOTE_CONTROLLER="app/Http/Controllers/Api/AppointmentController.php"
REMOTE_MODEL="app/Models/Appointment.php"

# Verificar se os arquivos locais existem
if [ ! -f "$LOCAL_CONTROLLER" ]; then
    echo "❌ Arquivo local não encontrado: $LOCAL_CONTROLLER"
    exit 1
fi

if [ ! -f "$LOCAL_MODEL" ]; then
    echo "❌ Arquivo local não encontrado: $LOCAL_MODEL"
    exit 1
fi

# Copiar arquivos para o servidor
echo "📤 Copiando arquivos para o servidor..."
sshpass -p 'yhvh77' scp "$LOCAL_CONTROLLER" "$SERVER:/tmp/AppointmentController_NOVO.php"
sshpass -p 'yhvh77' scp "$LOCAL_MODEL" "$SERVER:/tmp/Appointment_MODEL_NOVO.php"

# Executar comandos no servidor
echo "🔧 Aplicando alterações no servidor..."
sshpass -p 'yhvh77' ssh "$SERVER" bash << 'ENDSSH'
cd /var/www/lacos-backend

# Criar backups
echo "📦 Criando backups..."
echo 'yhvh77' | sudo -S cp app/Http/Controllers/Api/AppointmentController.php app/Http/Controllers/Api/AppointmentController.php.bak.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
echo 'yhvh77' | sudo -S cp app/Models/Appointment.php app/Models/Appointment.php.bak.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# Copiar novos arquivos
echo "📝 Copiando novos arquivos..."
echo 'yhvh77' | sudo -S cp /tmp/AppointmentController_NOVO.php app/Http/Controllers/Api/AppointmentController.php 2>/dev/null
echo 'yhvh77' | sudo -S cp /tmp/Appointment_MODEL_NOVO.php app/Models/Appointment.php 2>/dev/null
echo 'yhvh77' | sudo -S chown www-data:www-data app/Http/Controllers/Api/AppointmentController.php 2>/dev/null
echo 'yhvh77' | sudo -S chown www-data:www-data app/Models/Appointment.php 2>/dev/null

# Verificar sintaxe PHP
echo "🔍 Verificando sintaxe PHP..."
php -l app/Http/Controllers/Api/AppointmentController.php
php -l app/Models/Appointment.php

# Limpar cache
echo "🧹 Limpando cache..."
php artisan optimize:clear
php artisan route:clear
php artisan config:clear
php artisan cache:clear

echo "✅ AppointmentController e Appointment Model atualizados com sucesso!"
ENDSSH

echo "✅ Concluído!"

