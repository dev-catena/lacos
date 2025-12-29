#!/bin/bash

# Script para corrigir a linha 19 problemática

set -e

cd /var/www/lacos-backend

echo "🔧 Corrigindo linha 19 do bootstrap/app.php..."

# 1. Fazer backup
echo ""
echo "1️⃣ Fazendo backup..."
cp bootstrap/app.php bootstrap/app.php.backup.$(date +%s)
echo "✅ Backup criado"

# 2. Mostrar a linha problemática
echo ""
echo "2️⃣ Linha problemática:"
sed -n '19p' bootstrap/app.php

# 3. Corrigir a linha 19
echo ""
echo "3️⃣ Corrigindo linha 19..."

# A linha tem: $middleware//->statefulApi();
# Deve ser: // $middleware->statefulApi();
sed -i '19s/.*/        \/\/ $middleware->statefulApi(); \/\/ Desabilitado para permitir API sem CSRF/' bootstrap/app.php

# 4. Verificar sintaxe
echo ""
echo "4️⃣ Verificando sintaxe..."
if php -l bootstrap/app.php 2>&1 | grep -q "No syntax errors"; then
    echo "✅ Sintaxe OK!"
else
    echo "❌ Ainda há erro. Tentando outra correção..."
    
    # Remover completamente a linha problemática
    sed -i '19d' bootstrap/app.php
    
    # Verificar novamente
    if php -l bootstrap/app.php 2>&1 | grep -q "No syntax errors"; then
        echo "✅ Sintaxe corrigida (linha removida)!"
    else
        echo "❌ Erro persistente. Mostrando contexto:"
        sed -n '15,25p' bootstrap/app.php
        echo ""
        echo "⚠️  Edite manualmente: nano bootstrap/app.php"
        exit 1
    fi
fi

# 5. Mostrar linha corrigida
echo ""
echo "5️⃣ Linha corrigida:"
sed -n '19p' bootstrap/app.php || sed -n '18,20p' bootstrap/app.php

# 6. Limpar caches
echo ""
echo "6️⃣ Limpando caches..."
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true
php artisan optimize:clear 2>/dev/null || true
echo "✅ Caches limpos"

# 7. Testar
echo ""
echo "7️⃣ Testando..."
sleep 1
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/admin/login -X OPTIONS \
  -H 'Origin: http://localhost:3000' 2>&1)
echo "📊 Código HTTP: $HTTP_CODE"

echo ""
echo "✅ Correção concluída!"

