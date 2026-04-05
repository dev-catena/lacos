#!/bin/bash

# Script para atualizar AdminDoctorController no servidor

set -e

cd /var/www/lacos-backend

echo "🔧 Atualizando AdminDoctorController..."

# Verificar se o arquivo existe em /tmp
if [ -f "/tmp/AdminDoctorController.php" ]; then
    echo "📦 Copiando AdminDoctorController de /tmp/..."
    cp /tmp/AdminDoctorController.php app/Http/Controllers/Api/AdminDoctorController.php
    chown www-data:www-data app/Http/Controllers/Api/AdminDoctorController.php
    echo "✅ AdminDoctorController atualizado"
else
    echo "❌ Arquivo não encontrado em /tmp/"
    echo "   Execute: scp AdminDoctorController.php darley@192.168.0.20:/tmp/"
    exit 1
fi

# Verificar sintaxe PHP
echo ""
echo "🔍 Verificando sintaxe..."
php -l app/Http/Controllers/Api/AdminDoctorController.php

# Limpar cache
echo ""
echo "🧹 Limpando cache..."
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true
echo "✅ Caches limpos"

echo ""
echo "✅ Atualização concluída!"

