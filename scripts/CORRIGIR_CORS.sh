#!/bin/bash

# Script para configurar CORS no Laravel

set -e

cd /var/www/lacos-backend

echo "🔧 Configurando CORS..."

# 1. Verificar se config/cors.php existe
if [ -f "config/cors.php" ]; then
    echo "✅ config/cors.php existe"
else
    echo "📝 Criando config/cors.php..."
    mkdir -p config
fi

# 2. Criar/Atualizar config/cors.php
cat > config/cors.php << 'EOF'
<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'http://192.168.0.20',
        'https://192.168.0.20',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
EOF

chown www-data:www-data config/cors.php
echo "✅ config/cors.php configurado"

# 3. Verificar se HandleCors está no bootstrap/app.php ou Kernel
echo ""
echo "3️⃣ Verificando middleware CORS..."

if [ -f "bootstrap/app.php" ]; then
    if grep -q "HandleCors\|cors" bootstrap/app.php; then
        echo "✅ CORS middleware encontrado em bootstrap/app.php"
    else
        echo "⚠️  CORS middleware não encontrado explicitamente"
        echo "   No Laravel 11, CORS é habilitado por padrão se config/cors.php existir"
    fi
fi

# 4. Verificar se há HandleCors no Kernel (Laravel 10 ou anterior)
if [ -f "app/Http/Kernel.php" ]; then
    if grep -q "HandleCors" app/Http/Kernel.php; then
        echo "✅ CORS middleware encontrado em Kernel.php"
    else
        echo "⚠️  CORS middleware não encontrado em Kernel.php"
    fi
fi

# 5. Limpar caches
echo ""
echo "5️⃣ Limpando caches..."
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true
php artisan optimize:clear 2>/dev/null || true
echo "✅ Caches limpos"

# 6. Reiniciar PHP-FPM
echo ""
echo "6️⃣ Reiniciando PHP-FPM..."
PHP_VERSION=$(php -v | head -1 | grep -oP '\d+\.\d+' | head -1)
if systemctl list-units --type=service | grep -q "php.*fpm"; then
    PHP_SERVICE=$(systemctl list-units --type=service | grep "php.*fpm" | awk '{print $1}' | head -1)
    systemctl restart "$PHP_SERVICE" && echo "✅ $PHP_SERVICE reiniciado" || echo "⚠️  Erro ao reiniciar"
fi

# 7. Testar CORS
echo ""
echo "7️⃣ Testando CORS..."
sleep 2

# Testar preflight (OPTIONS)
echo "📡 Testando preflight (OPTIONS)..."
OPTIONS_RESPONSE=$(curl -s -X OPTIONS http://localhost/api/admin/login \
  -H 'Origin: http://localhost:3000' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: Content-Type' \
  -i 2>&1)

if echo "$OPTIONS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ Preflight OK - CORS headers presentes"
else
    echo "⚠️  Preflight pode não estar funcionando"
    echo "📄 Resposta:"
    echo "$OPTIONS_RESPONSE" | head -20
fi

echo ""
echo "✅ Configuração CORS concluída!"
echo ""
echo "📝 Origens permitidas:"
echo "   - http://localhost:3000"
echo "   - http://localhost:5173"
echo "   - http://192.168.0.20"
echo ""
echo "🔄 Se ainda houver erro:"
echo "   1. Reinicie o servidor web: sudo systemctl restart nginx"
echo "   2. Verifique se o middleware HandleCors está ativo"
echo "   3. Teste com: curl -H 'Origin: http://localhost:3000' -H 'Access-Control-Request-Method: POST' -X OPTIONS http://192.168.0.20/api/admin/login -v"

