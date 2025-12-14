#!/bin/bash

# Script definitivo para corrigir CSRF - Laravel 11

set -e

cd /var/www/lacos-backend

echo "🔧 Correção definitiva de CSRF para Laravel 11..."

# 1. Verificar bootstrap/app.php
echo ""
echo "1️⃣ Verificando bootstrap/app.php..."
if [ -f "bootstrap/app.php" ]; then
    # Verificar se tem statefulApi() que aplica CSRF
    if grep -q "statefulApi" bootstrap/app.php; then
        echo "⚠️  statefulApi() encontrado - isso aplica CSRF em rotas API!"
        echo "📝 Comentando statefulApi() para desabilitar CSRF em API..."
        
        # Fazer backup
        cp bootstrap/app.php bootstrap/app.php.backup
        
        # Comentar statefulApi
        sed -i 's/->statefulApi();/\/\/->statefulApi(); \/\/ Desabilitado para permitir API sem CSRF/' bootstrap/app.php
        
        echo "✅ statefulApi() desabilitado"
    else
        echo "✅ statefulApi() não encontrado ou já desabilitado"
    fi
fi

# 2. Garantir VerifyCsrfToken exclui tudo
echo ""
echo "2️⃣ Atualizando VerifyCsrfToken..."
cat > app/Http/Middleware/VerifyCsrfToken.php << 'EOF'
<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        'api/*',  // Excluir TODAS as rotas de API
    ];
}
EOF
chown www-data:www-data app/Http/Middleware/VerifyCsrfToken.php
echo "✅ VerifyCsrfToken atualizado"

# 3. Verificar se routes/api.php está correto
echo ""
echo "3️⃣ Verificando routes/api.php..."
if [ -f "routes/api.php" ]; then
    # Garantir que não tem prefixo /api duplicado
    if grep -q "Route::post('/api/admin/login'" routes/api.php; then
        echo "⚠️  Rota tem prefixo /api duplicado, corrigindo..."
        sed -i "s|Route::post('/api/admin/login'|Route::post('admin/login'|g" routes/api.php
        echo "✅ Corrigido"
    fi
    echo "📄 Conteúdo atual:"
    cat routes/api.php
fi

# 4. Garantir que não está em web.php
echo ""
echo "4️⃣ Verificando routes/web.php..."
if [ -f "routes/web.php" ] && grep -q "admin/login" routes/web.php; then
    echo "⚠️  Rota ainda está em web.php, removendo..."
    sed -i '/admin\/login/d' routes/web.php
    echo "✅ Removido"
else
    echo "✅ Rota não está em web.php"
fi

# 5. Limpar todos os caches
echo ""
echo "5️⃣ Limpando caches..."
php artisan route:clear 2>/dev/null || true
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true
php artisan view:clear 2>/dev/null || true
php artisan optimize:clear 2>/dev/null || true
echo "✅ Caches limpos"

# 6. Reiniciar PHP-FPM
echo ""
echo "6️⃣ Reiniciando PHP-FPM..."
PHP_VERSION=$(php -v | head -1 | grep -oP '\d+\.\d+' | head -1)
echo "📌 Versão PHP: $PHP_VERSION"

if systemctl list-units --type=service | grep -q "php.*fpm"; then
    PHP_SERVICE=$(systemctl list-units --type=service | grep "php.*fpm" | awk '{print $1}' | head -1)
    echo "🔄 Reiniciando $PHP_SERVICE..."
    systemctl restart "$PHP_SERVICE" && echo "✅ $PHP_SERVICE reiniciado" || echo "⚠️  Erro ao reiniciar"
else
    echo "⚠️  PHP-FPM não encontrado, tente manualmente:"
    echo "   sudo systemctl restart php$PHP_VERSION-fpm"
fi

# 7. Testar
echo ""
echo "7️⃣ Testando endpoint..."
sleep 2  # Aguardar PHP-FPM reiniciar
RESPONSE=$(curl -s -X POST http://localhost/api/admin/login \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{"email":"root@lacos.com","password":"yhvh77"}' 2>&1)

if echo "$RESPONSE" | grep -q "419\|CSRF"; then
    echo "❌ Ainda há erro CSRF"
    echo "📄 Resposta: $RESPONSE"
else
    if echo "$RESPONSE" | grep -q "token"; then
        echo "✅ Login funcionando! CSRF corrigido."
    else
        echo "⚠️  Resposta: $RESPONSE"
    fi
fi

echo ""
echo "✅ Correção concluída!"
echo ""
echo "📝 Se ainda houver erro 419:"
echo "   1. Verifique se statefulApi() está comentado em bootstrap/app.php"
echo "   2. Reinicie o servidor web: sudo systemctl restart nginx"
echo "   3. Verifique logs: tail -f storage/logs/laravel.log"

