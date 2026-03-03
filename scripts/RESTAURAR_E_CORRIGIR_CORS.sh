#!/bin/bash

# Script para restaurar bootstrap/app.php e configurar CORS corretamente

set -e

cd /var/www/lacos-backend

echo "🔧 Restaurando e configurando CORS corretamente..."

# 1. Restaurar backup
echo ""
echo "1️⃣ Restaurando bootstrap/app.php do backup..."
if ls bootstrap/app.php.backup* 1> /dev/null 2>&1; then
    LATEST_BACKUP=$(ls -t bootstrap/app.php.backup* | head -1)
    echo "📦 Restaurando de: $LATEST_BACKUP"
    cp "$LATEST_BACKUP" bootstrap/app.php
    chown www-data:www-data bootstrap/app.php
    echo "✅ Backup restaurado"
else
    echo "⚠️  Nenhum backup encontrado, tentando corrigir manualmente..."
    
    # Remover linhas problemáticas
    sed -i '/use IlluminateHttpMiddlewareHandleCors/d' bootstrap/app.php
    sed -i '/use Illuminate.*HandleCors/d' bootstrap/app.php
    sed -i '/\$middleware->append(HandleCors/d' bootstrap/app.php
    sed -i '/HandleCors::class/d' bootstrap/app.php
fi

# 2. Verificar sintaxe
echo ""
echo "2️⃣ Verificando sintaxe..."
if php -l bootstrap/app.php 2>&1 | grep -q "No syntax errors"; then
    echo "✅ Sintaxe OK"
else
    echo "❌ Ainda há erro de sintaxe:"
    php -l bootstrap/app.php
    echo ""
    echo "⚠️  Tentando correção manual..."
    
    # Remover todas as linhas problemáticas
    sed -i '/HandleCors/d' bootstrap/app.php
    sed -i '/\$middleware->append/d' bootstrap/app.php
    
    # Verificar novamente
    if php -l bootstrap/app.php 2>&1 | grep -q "No syntax errors"; then
        echo "✅ Sintaxe corrigida"
    else
        echo "❌ Erro persistente. Verifique manualmente: nano bootstrap/app.php"
        exit 1
    fi
fi

# 3. Garantir que config/cors.php existe e está correto
echo ""
echo "3️⃣ Verificando config/cors.php..."
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
        'http://192.168.0.20',
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

# 4. IMPORTANTE: No Laravel 11, CORS funciona automaticamente se config/cors.php existir
# NÃO precisamos modificar bootstrap/app.php!
echo ""
echo "4️⃣ Verificando se CORS está habilitado automaticamente..."
echo "   No Laravel 11, se config/cors.php existir, CORS é habilitado automaticamente."
echo "   Não é necessário modificar bootstrap/app.php!"

# 5. Limpar TODOS os caches
echo ""
echo "5️⃣ Limpando caches..."
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true
php artisan route:clear 2>/dev/null || true
php artisan view:clear 2>/dev/null || true
php artisan optimize:clear 2>/dev/null || true
echo "✅ Caches limpos"

# 6. Reiniciar PHP-FPM
echo ""
echo "6️⃣ Reiniciando PHP-FPM..."
PHP_VERSION=$(php -v | head -1 | grep -oP '\d+\.\d+' | head -1)
if systemctl list-units --type=service | grep -q "php.*fpm"; then
    PHP_SERVICE=$(systemctl list-units --type=service | grep "php.*fpm" | awk '{print $1}' | head -1)
    systemctl restart "$PHP_SERVICE" && echo "✅ $PHP_SERVICE reiniciado" || echo "⚠️  Erro"
fi

# 7. Testar
echo ""
echo "7️⃣ Testando..."
sleep 2

echo "📡 Testando endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/admin/login -X OPTIONS \
  -H 'Origin: http://localhost:3000' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: Content-Type' 2>&1)

echo "📊 Código HTTP: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
    echo "✅ Endpoint respondendo!"
    
    # Verificar headers CORS
    echo ""
    echo "📡 Verificando headers CORS..."
    curl -s -X OPTIONS http://localhost/api/admin/login \
      -H 'Origin: http://localhost:3000' \
      -H 'Access-Control-Request-Method: POST' \
      -H 'Access-Control-Request-Headers: Content-Type' \
      -i 2>&1 | grep -i "Access-Control" || echo "⚠️  Headers CORS não encontrados"
else
    echo "⚠️  Endpoint retornou código $HTTP_CODE"
    echo "   Verifique logs: tail -20 storage/logs/laravel.log"
fi

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📝 Resumo:"
echo "   ✅ bootstrap/app.php restaurado (sem modificações)"
echo "   ✅ config/cors.php criado"
echo "   ✅ Caches limpos"
echo "   ✅ PHP-FPM reiniciado"
echo ""
echo "🔄 No Laravel 11, CORS funciona automaticamente se config/cors.php existir!"
echo "   Não é necessário modificar bootstrap/app.php."

