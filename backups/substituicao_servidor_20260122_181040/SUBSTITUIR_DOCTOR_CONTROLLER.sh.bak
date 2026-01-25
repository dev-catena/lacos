#!/bin/bash

# Script simples para substituir AdminDoctorController

set -e

cd /var/www/lacos-backend

echo "🔧 Substituindo AdminDoctorController..."

# Verificar se arquivo corrigido existe
if [ -f "/tmp/AdminDoctorController_corrigido.php" ]; then
    echo "📦 Copiando arquivo corrigido..."
    cp /tmp/AdminDoctorController_corrigido.php app/Http/Controllers/Api/AdminDoctorController.php
    chown www-data:www-data app/Http/Controllers/Api/AdminDoctorController.php
    echo "✅ Arquivo substituído"
elif [ -f "/tmp/AdminDoctorController.php" ]; then
    echo "📦 Copiando de /tmp/AdminDoctorController.php..."
    cp /tmp/AdminDoctorController.php app/Http/Controllers/Api/AdminDoctorController.php
    chown www-data:www-data app/Http/Controllers/Api/AdminDoctorController.php
    echo "✅ Arquivo substituído"
else
    echo "❌ Arquivo não encontrado em /tmp/"
    exit 1
fi

# Verificar sintaxe
echo ""
echo "🔍 Verificando sintaxe..."
php -l app/Http/Controllers/Api/AdminDoctorController.php

# Verificar se tem relacionamento specialty
if grep -q "->with(\['specialty'\]" app/Http/Controllers/Api/AdminDoctorController.php; then
    echo "⚠️  AINDA TEM relacionamento specialty! Corrigindo..."
    # Executar script de correção
    bash /tmp/CORRIGIR_DOCTOR_CONTROLLER_DEFINITIVO.sh
else
    echo "✅ Nenhum relacionamento specialty encontrado"
fi

# Limpar cache
echo ""
echo "🧹 Limpando cache..."
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true
echo "✅ Caches limpos"

echo ""
echo "✅ Concluído!"

