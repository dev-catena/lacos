#!/bin/bash

# Script para corrigir CORS no Laravel 11

set -e

cd /var/www/lacos-backend

echo "🔧 Configurando CORS para Laravel 11..."

# 1. Criar config/cors.php
echo ""
echo "1️⃣ Criando config/cors.php..."
mkdir -p config

cat > config/cors.php << 'EOF'
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'admin/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'http://10.102.0.103',
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
EOF

chown www-data:www-data config/cors.php
echo "✅ config/cors.php criado"

# 2. Verificar e modificar bootstrap/app.php se necessário
echo ""
echo "2️⃣ Verificando bootstrap/app.php..."

if [ -f "bootstrap/app.php" ]; then
    # Verificar se HandleCors já está sendo usado
    if grep -q "HandleCors" bootstrap/app.php; then
        echo "✅ HandleCors já está em bootstrap/app.php"
    else
        echo "📝 Adicionando HandleCors ao bootstrap/app.php..."
        
        # Fazer backup
        cp bootstrap/app.php bootstrap/app.php.backup.$(date +%s)
        
        # Adicionar use statement
        if ! grep -q "use Illuminate\\\\Http\\\\Middleware\\\\HandleCors;" bootstrap/app.php; then
            # Encontrar última linha de use e adicionar
            LAST_USE_LINE=$(grep -n "^use " bootstrap/app.php | tail -1 | cut -d: -f1)
            if [ -n "$LAST_USE_LINE" ]; then
                sed -i "${LAST_USE_LINE}a\\use Illuminate\\Http\\Middleware\\HandleCors;" bootstrap/app.php
            fi
        fi
        
        # Adicionar HandleCors ao middleware
        # Procurar por ->withMiddleware e adicionar HandleCors
        if grep -q "->withMiddleware" bootstrap/app.php; then
            # Adicionar HandleCors dentro do withMiddleware
            sed -i '/->withMiddleware(function (Middleware \$middleware) {/a\        $middleware->append(HandleCors::class);' bootstrap/app.php
            echo "✅ HandleCors adicionado ao middleware"
        else
            echo "⚠️  withMiddleware não encontrado, pode ser Laravel 10 ou anterior"
        fi
    fi
fi

# 3. Limpar caches
echo ""
echo "3️⃣ Limpando caches..."
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true
php artisan optimize:clear 2>/dev/null || true
echo "✅ Caches limpos"

# 4. Reiniciar PHP-FPM
echo ""
echo "4️⃣ Reiniciando PHP-FPM..."
PHP_VERSION=$(php -v | head -1 | grep -oP '\d+\.\d+' | head -1)
if systemctl list-units --type=service | grep -q "php.*fpm"; then
    PHP_SERVICE=$(systemctl list-units --type=service | grep "php.*fpm" | awk '{print $1}' | head -1)
    systemctl restart "$PHP_SERVICE" && echo "✅ $PHP_SERVICE reiniciado" || echo "⚠️  Erro"
fi

# 5. Testar
echo ""
echo "5️⃣ Testando CORS..."
sleep 2

curl -s -X OPTIONS http://localhost/api/admin/login \
  -H 'Origin: http://localhost:3000' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: Content-Type' \
  -i 2>&1 | head -20

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📝 Se ainda houver erro CORS:"
echo "   1. Verifique bootstrap/app.php: cat bootstrap/app.php | grep -A 5 HandleCors"
echo "   2. Reinicie nginx: sudo systemctl restart nginx"
echo "   3. Teste: curl -H 'Origin: http://localhost:3000' -X OPTIONS http://10.102.0.103/api/admin/login -v"

