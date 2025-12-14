#!/bin/bash

# Script para corrigir CSRF token mismatch na rota admin/login

set -e

cd /var/www/lacos-backend

echo "🔧 Corrigindo CSRF token mismatch..."

# 1. Verificar se existe VerifyCsrfToken middleware
if [ -f "app/Http/Middleware/VerifyCsrfToken.php" ]; then
    echo "✅ VerifyCsrfToken encontrado"
    
    # Verificar se já tem a exceção
    if grep -q "admin/login" app/Http/Middleware/VerifyCsrfToken.php; then
        echo "✅ Rota /api/admin/login já está nas exceções"
    else
        echo "📝 Adicionando /api/admin/login nas exceções CSRF..."
        
        # Verificar se já existe array $except
        if grep -q "protected \$except" app/Http/Middleware/VerifyCsrfToken.php; then
            # Adicionar à lista existente
            sed -i '/protected \$except = \[/a\        '\''api/admin/login'\'',' app/Http/Middleware/VerifyCsrfToken.php
        else
            # Adicionar array $except se não existir
            # Encontrar a linha da classe e adicionar após
            CLASS_LINE=$(grep -n "class VerifyCsrfToken" app/Http/Middleware/VerifyCsrfToken.php | cut -d: -f1)
            if [ -n "$CLASS_LINE" ]; then
                sed -i "${CLASS_LINE}a\\    protected \$except = [\n        'api/admin/login',\n    ];" app/Http/Middleware/VerifyCsrfToken.php
            fi
        fi
        echo "✅ Exceção adicionada"
    fi
else
    echo "⚠️  VerifyCsrfToken não encontrado, criando..."
    mkdir -p app/Http/Middleware
    
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
        'api/admin/login',
        'api/admin/logout',
    ];
}
EOF
    chown www-data:www-data app/Http/Middleware/VerifyCsrfToken.php
    echo "✅ VerifyCsrfToken criado com exceções"
fi

# 2. Garantir que routes/api.php está sendo carregado como API route
# Verificar RouteServiceProvider ou bootstrap/app.php
if [ -f "app/Providers/RouteServiceProvider.php" ]; then
    if grep -q "routes/api.php" app/Providers/RouteServiceProvider.php; then
        echo "✅ RouteServiceProvider carrega routes/api.php"
    else
        echo "⚠️  RouteServiceProvider pode não estar carregando routes/api.php"
    fi
fi

# 3. Limpar cache
echo "🧹 Limpando cache..."
php artisan route:clear 2>/dev/null || true
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true

echo ""
echo "✅ Correção concluída!"
echo ""
echo "📋 Verificando..."
php artisan route:list | grep -i "admin/login" && echo "✅ Rota encontrada!" || echo "⚠️  Rota não encontrada"

