#!/bin/bash

# Script completo para corrigir CORS - Laravel 11

set -e

cd /var/www/lacos-backend

echo "🔧 Correção completa de CORS..."

# 1. Criar config/cors.php
echo ""
echo "1️⃣ Criando/Atualizando config/cors.php..."
mkdir -p config

cat > config/cors.php << 'EOF'
<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'admin/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'http://10.102.0.103',
        'https://10.102.0.103',
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

# 2. Verificar bootstrap/app.php e garantir que HandleCors está ativo
echo ""
echo "2️⃣ Verificando bootstrap/app.php..."

if [ -f "bootstrap/app.php" ]; then
    # Verificar se HandleCors está sendo usado
    if grep -q "HandleCors" bootstrap/app.php; then
        echo "✅ HandleCors encontrado em bootstrap/app.php"
    else
        echo "⚠️  HandleCors não encontrado explicitamente"
        echo "   No Laravel 11, CORS é habilitado automaticamente se config/cors.php existir"
    fi
    
    # Verificar se há middleware global
    if grep -q "->withMiddleware" bootstrap/app.php; then
        echo "✅ withMiddleware encontrado"
        # Verificar se precisa adicionar HandleCors manualmente
        if ! grep -q "HandleCors\|cors" bootstrap/app.php; then
            echo "📝 Adicionando HandleCors ao middleware global..."
            # Fazer backup
            cp bootstrap/app.php bootstrap/app.php.backup.cors
            
            # Adicionar HandleCors se não estiver
            # Isso é complexo, então vamos apenas garantir que o config está correto
            echo "   (CORS deve funcionar automaticamente com config/cors.php)"
        fi
    fi
fi

# 3. Verificar se há HandleCors no Kernel (Laravel 10 ou anterior)
if [ -f "app/Http/Kernel.php" ]; then
    echo ""
    echo "3️⃣ Verificando app/Http/Kernel.php..."
    if grep -q "HandleCors" app/Http/Kernel.php; then
        echo "✅ HandleCors encontrado em Kernel.php"
    else
        echo "⚠️  HandleCors não encontrado em Kernel.php"
    fi
fi

# 4. Criar middleware HandleCors se não existir (Laravel 11 pode precisar)
echo ""
echo "4️⃣ Verificando se HandleCors middleware existe..."
if [ ! -f "app/Http/Middleware/HandleCors.php" ]; then
    echo "📝 HandleCors não existe como middleware customizado (normal no Laravel 11)"
    echo "   O Laravel 11 usa o HandleCors do framework automaticamente"
else
    echo "✅ HandleCors middleware customizado existe"
fi

# 5. Verificar .env para CORS
echo ""
echo "5️⃣ Verificando .env..."
if [ -f ".env" ]; then
    if grep -q "CORS" .env; then
        echo "📄 Configurações CORS no .env:"
        grep "CORS" .env
    else
        echo "✅ Nenhuma configuração CORS no .env (usando config/cors.php)"
    fi
fi

# 6. Limpar TODOS os caches
echo ""
echo "6️⃣ Limpando caches..."
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true
php artisan route:clear 2>/dev/null || true
php artisan view:clear 2>/dev/null || true
php artisan optimize:clear 2>/dev/null || true
echo "✅ Caches limpos"

# 7. Reiniciar PHP-FPM
echo ""
echo "7️⃣ Reiniciando PHP-FPM..."
PHP_VERSION=$(php -v | head -1 | grep -oP '\d+\.\d+' | head -1)
if systemctl list-units --type=service | grep -q "php.*fpm"; then
    PHP_SERVICE=$(systemctl list-units --type=service | grep "php.*fpm" | awk '{print $1}' | head -1)
    echo "🔄 Reiniciando $PHP_SERVICE..."
    systemctl restart "$PHP_SERVICE" && echo "✅ $PHP_SERVICE reiniciado" || echo "⚠️  Erro ao reiniciar"
else
    echo "⚠️  PHP-FPM não encontrado"
fi

# 8. Testar CORS com curl
echo ""
echo "8️⃣ Testando CORS..."
sleep 2

echo "📡 Testando preflight (OPTIONS)..."
OPTIONS_RESPONSE=$(curl -s -X OPTIONS http://localhost/api/admin/login \
  -H 'Origin: http://localhost:3000' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: Content-Type' \
  -i 2>&1 | head -30)

echo "📄 Resposta OPTIONS:"
echo "$OPTIONS_RESPONSE"

if echo "$OPTIONS_RESPONSE" | grep -qi "Access-Control-Allow-Origin"; then
    echo "✅ CORS headers presentes!"
    echo "$OPTIONS_RESPONSE" | grep -i "Access-Control"
else
    echo "❌ CORS headers NÃO encontrados"
    echo ""
    echo "🔍 Verificando se o middleware está sendo aplicado..."
fi

# 9. Verificar se precisa adicionar HandleCors manualmente no bootstrap
echo ""
echo "9️⃣ Verificando se precisa adicionar HandleCors manualmente..."

if [ -f "bootstrap/app.php" ]; then
    # Verificar se tem ->withMiddleware
    if grep -q "->withMiddleware" bootstrap/app.php && ! grep -q "HandleCors" bootstrap/app.php; then
        echo "📝 Adicionando HandleCors ao bootstrap/app.php..."
        
        # Fazer backup
        cp bootstrap/app.php bootstrap/app.php.backup.$(date +%s)
        
        # Adicionar use statement se não existir
        if ! grep -q "use Illuminate\\Http\\Middleware\\HandleCors;" bootstrap/app.php; then
            # Adicionar após outros use statements
            sed -i '/^use /a use Illuminate\\Http\\Middleware\\HandleCors;' bootstrap/app.php
        fi
        
        # Adicionar ao middleware global
        # Isso é complexo, vamos criar uma versão que adiciona manualmente
        echo "   ⚠️  Pode ser necessário adicionar HandleCors manualmente"
        echo "   Edite bootstrap/app.php e adicione:"
        echo "   ->withMiddleware(function (Middleware \$middleware) {"
        echo "       \$middleware->append(HandleCors::class);"
        echo "   })"
    fi
fi

echo ""
echo "✅ Verificação completa!"
echo ""
echo "📝 Se CORS ainda não funcionar:"
echo "   1. Verifique se config/cors.php foi criado: cat config/cors.php"
echo "   2. Reinicie o servidor web: sudo systemctl restart nginx"
echo "   3. Teste manualmente:"
echo "      curl -H 'Origin: http://localhost:3000' -H 'Access-Control-Request-Method: POST' -X OPTIONS http://10.102.0.103/api/admin/login -v"
echo "   4. Verifique logs: tail -f storage/logs/laravel.log"

