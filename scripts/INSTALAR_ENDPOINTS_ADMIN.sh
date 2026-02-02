#!/bin/bash

# Script para instalar endpoints de admin no servidor
# Execute como root no servidor

set -e

cd /var/www/lacos-backend

echo "🚀 Instalando endpoints de admin..."

# Verificar se os controllers existem na raiz ou em /tmp
if [ -f "/tmp/AdminUserController.php" ] && [ -f "/tmp/AdminDoctorController.php" ]; then
    echo "📦 Copiando controllers de /tmp/..."
    cp /tmp/AdminUserController.php .
    cp /tmp/AdminDoctorController.php .
elif [ -f "AdminUserController.php" ] && [ -f "AdminDoctorController.php" ]; then
    echo "✅ Controllers encontrados na raiz"
else
    echo "❌ Controllers não encontrados!"
    echo "   Verificando /tmp/..."
    ls -la /tmp/Admin*.php 2>/dev/null || echo "   Nenhum arquivo encontrado em /tmp/"
    exit 1
fi

# Mover controllers para o diretório correto
echo "📁 Movendo controllers..."
mkdir -p app/Http/Controllers/Api
mv AdminUserController.php app/Http/Controllers/Api/AdminUserController.php
mv AdminDoctorController.php app/Http/Controllers/Api/AdminDoctorController.php

# Ajustar permissões
chown www-data:www-data app/Http/Controllers/Api/AdminUserController.php
chown www-data:www-data app/Http/Controllers/Api/AdminDoctorController.php

echo "✅ Controllers movidos"

# Executar migrations
echo "📦 Executando migrations..."

# Verificar se as migrations estão em /tmp ou na raiz
if [ -f "/tmp/add_is_blocked_to_users.php" ]; then
    cp /tmp/add_is_blocked_to_users.php .
elif [ ! -f "add_is_blocked_to_users.php" ]; then
    echo "⚠️  Migration add_is_blocked_to_users.php não encontrada, pulando..."
fi

if [ -f "/tmp/add_doctor_fields_to_users.php" ]; then
    cp /tmp/add_doctor_fields_to_users.php .
elif [ ! -f "add_doctor_fields_to_users.php" ]; then
    echo "⚠️  Migration add_doctor_fields_to_users.php não encontrada, pulando..."
fi

if [ -f "add_is_blocked_to_users.php" ]; then
    TIMESTAMP1=$(date +%Y_%m_%d_%H%M%S)
    mv add_is_blocked_to_users.php database/migrations/${TIMESTAMP1}_add_is_blocked_to_users.php
    php artisan migrate --path=database/migrations/${TIMESTAMP1}_add_is_blocked_to_users.php
    echo "✅ Migration is_blocked executada"
fi

if [ -f "add_doctor_fields_to_users.php" ]; then
    TIMESTAMP2=$(date +%Y_%m_%d_%H%M%S)
    mv add_doctor_fields_to_users.php database/migrations/${TIMESTAMP2}_add_doctor_fields_to_users.php
    php artisan migrate --path=database/migrations/${TIMESTAMP2}_add_doctor_fields_to_users.php
    echo "✅ Migration doctor_fields executada"
fi

echo ""
echo "✅ Endpoints de admin instalados!"
echo ""
echo "📋 Endpoints criados:"
echo "   GET    /api/admin/users"
echo "   POST   /api/admin/users/{id}/block"
echo "   POST   /api/admin/users/{id}/unblock"
echo "   GET    /api/admin/users/{id}/plan"
echo "   GET    /api/admin/doctors/pending"
echo "   GET    /api/admin/doctors"
echo "   POST   /api/admin/doctors/{id}/approve"
echo "   POST   /api/admin/doctors/{id}/reject"
echo "   POST   /api/admin/doctors/{id}/block"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   1. Verifique se as rotas foram adicionadas ao arquivo de rotas"
echo "   2. Adicione middleware de verificação de root/admin se necessário"
echo "   3. Atualize o AuthController para verificar is_blocked no login"

