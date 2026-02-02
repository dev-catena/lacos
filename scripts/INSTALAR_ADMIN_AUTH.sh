#!/bin/bash

# Script para instalar AdminAuthController no servidor
# Execute como root no servidor

set -e

cd /var/www/lacos-backend

echo "🚀 Instalando AdminAuthController..."

# Verificar se o controller existe em /tmp ou na raiz
if [ -f "/tmp/AdminAuthController.php" ]; then
    echo "📦 Copiando controller de /tmp/..."
    cp /tmp/AdminAuthController.php .
elif [ -f "AdminAuthController.php" ]; then
    echo "✅ Controller encontrado na raiz"
else
    echo "❌ AdminAuthController.php não encontrado!"
    exit 1
fi

# Mover para o diretório correto
echo "📁 Movendo controller..."
mkdir -p app/Http/Controllers/Api
mv AdminAuthController.php app/Http/Controllers/Api/AdminAuthController.php

# Ajustar permissões
chown www-data:www-data app/Http/Controllers/Api/AdminAuthController.php

echo "✅ AdminAuthController instalado!"
echo ""
echo "📋 Endpoints criados:"
echo "   POST /api/admin/login - Login para root/admin"
echo "   POST /api/admin/logout - Logout (requer autenticação)"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   1. Verifique se as rotas foram adicionadas ao arquivo de rotas"
echo "   2. O login verifica se o usuário está bloqueado"
echo "   3. Você pode adicionar verificação específica de root no controller"

