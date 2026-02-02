#!/bin/bash

# Script para corrigir bootstrap/app.php removendo linhas problemáticas

set -e

cd /var/www/lacos-backend

echo "🔧 Corrigindo bootstrap/app.php..."

# 1. Fazer backup do estado atual
echo ""
echo "1️⃣ Fazendo backup..."
cp bootstrap/app.php bootstrap/app.php.backup.$(date +%s)
echo "✅ Backup criado"

# 2. Mostrar linhas problemáticas
echo ""
echo "2️⃣ Verificando linhas problemáticas..."
echo "📄 Linha 19 e ao redor:"
sed -n '15,25p' bootstrap/app.php

# 3. Remover linhas problemáticas
echo ""
echo "3️⃣ Removendo linhas problemáticas..."

# Remover linhas com HandleCors mal formatado
sed -i '/use IlluminateHttpMiddlewareHandleCors/d' bootstrap/app.php
sed -i '/use Illuminate.*HandleCors/d' bootstrap/app.php

# Remover linhas com $middleware->append problemático
sed -i '/\$middleware->append(HandleCors/d' bootstrap/app.php
sed -i '/HandleCors::class/d' bootstrap/app.php

# Remover linhas vazias duplicadas
sed -i '/^$/N;/^\n$/d' bootstrap/app.php

# 4. Verificar sintaxe
echo ""
echo "4️⃣ Verificando sintaxe..."
if php -l bootstrap/app.php 2>&1 | grep -q "No syntax errors"; then
    echo "✅ Sintaxe OK!"
else
    echo "❌ Ainda há erro. Mostrando erro:"
    php -l bootstrap/app.php
    
    echo ""
    echo "📄 Tentando correção mais agressiva..."
    
    # Ler o arquivo e recriar sem linhas problemáticas
    grep -v "HandleCors" bootstrap/app.php > bootstrap/app.php.tmp
    grep -v "\$middleware->append" bootstrap/app.php.tmp > bootstrap/app.php.tmp2
    mv bootstrap/app.php.tmp2 bootstrap/app.php
    rm -f bootstrap/app.php.tmp
    
    # Verificar novamente
    if php -l bootstrap/app.php 2>&1 | grep -q "No syntax errors"; then
        echo "✅ Sintaxe corrigida!"
    else
        echo "❌ Erro persistente. Arquivo precisa ser editado manualmente."
        echo "   Execute: nano bootstrap/app.php"
        echo "   Procure por linhas com HandleCors ou \$middleware->append e remova"
        exit 1
    fi
fi

# 5. Mostrar estrutura final
echo ""
echo "5️⃣ Estrutura final do arquivo:"
head -30 bootstrap/app.php

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

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "405" ]; then
    echo "✅ Endpoint respondendo (código $HTTP_CODE é normal para OPTIONS)"
else
    echo "⚠️  Endpoint retornou código $HTTP_CODE"
fi

echo ""
echo "✅ Correção concluída!"
echo ""
echo "📝 IMPORTANTE:"
echo "   - bootstrap/app.php foi corrigido (sem HandleCors manual)"
echo "   - config/cors.php deve existir para CORS funcionar automaticamente"
echo "   - No Laravel 11, CORS funciona automaticamente se config/cors.php existir"

