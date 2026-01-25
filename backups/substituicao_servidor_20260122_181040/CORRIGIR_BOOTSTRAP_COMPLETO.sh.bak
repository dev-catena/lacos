#!/bin/bash

# Script para corrigir bootstrap/app.php completamente

set -e

cd /var/www/lacos-backend

echo "🔧 Corrigindo bootstrap/app.php completamente..."

# 1. Fazer backup
echo ""
echo "1️⃣ Fazendo backup..."
cp bootstrap/app.php bootstrap/app.php.backup.$(date +%s)
echo "✅ Backup criado"

# 2. Mostrar contexto problemático
echo ""
echo "2️⃣ Contexto problemático (linhas 17-25):"
sed -n '17,25p' bootstrap/app.php

# 3. Corrigir a seção withMiddleware
echo ""
echo "3️⃣ Corrigindo seção withMiddleware..."

# Encontrar a linha do withMiddleware
MIDDLEWARE_START=$(grep -n "->withMiddleware" bootstrap/app.php | head -1 | cut -d: -f1)

if [ -n "$MIDDLEWARE_START" ]; then
    echo "📌 withMiddleware encontrado na linha $MIDDLEWARE_START"
    
    # Encontrar onde termina o withMiddleware (próxima ->)
    MIDDLEWARE_END=$(sed -n "${MIDDLEWARE_START},50p" bootstrap/app.php | grep -n "->" | head -2 | tail -1 | cut -d: -f1)
    MIDDLEWARE_END=$((MIDDLEWARE_START + MIDDLEWARE_END - 1))
    
    echo "📌 withMiddleware termina aproximadamente na linha $MIDDLEWARE_END"
    
    # Mostrar o bloco atual
    echo ""
    echo "📄 Bloco atual:"
    sed -n "${MIDDLEWARE_START},${MIDDLEWARE_END}p" bootstrap/app.php
    
    # Criar versão corrigida
    echo ""
    echo "📝 Criando versão corrigida..."
    
    # Salvar tudo antes do withMiddleware
    head -n $((MIDDLEWARE_START - 1)) bootstrap/app.php > bootstrap/app.php.tmp
    
    # Adicionar withMiddleware corrigido
    cat >> bootstrap/app.php.tmp << 'EOF'
    ->withMiddleware(function (Middleware $middleware) {
        // $middleware->statefulApi(); // Desabilitado para permitir API sem CSRF
        
        // Configurar para retornar JSON em rotas API quando não autenticado
        $middleware->redirectGuestsTo(function (Request $request) {
            if ($request->is('api/*')) {
                abort(401, 'Unauthenticated');
            }
            return route('login');
        });
    })
EOF
    
    # Adicionar tudo depois do withMiddleware
    tail -n +$((MIDDLEWARE_END + 1)) bootstrap/app.php >> bootstrap/app.php.tmp
    
    # Substituir arquivo
    mv bootstrap/app.php.tmp bootstrap/app.php
    chown www-data:www-data bootstrap/app.php
    
    echo "✅ Seção withMiddleware corrigida"
else
    echo "⚠️  withMiddleware não encontrado, tentando correção manual..."
    
    # Corrigir linha por linha
    sed -i 's/\$middleware\/\/->statefulApi();/\/\/ $middleware->statefulApi(); \/\/ Desabilitado para permitir API sem CSRF/' bootstrap/app.php
    
    # Garantir que redirectGuestsTo está completo
    if ! grep -q "\$middleware->redirectGuestsTo" bootstrap/app.php; then
        # Adicionar redirectGuestsTo se não existir
        sed -i '/\/\/ Configurar para retornar JSON/a\        $middleware->redirectGuestsTo(function (Request $request) {' bootstrap/app.php
    fi
fi

# 4. Verificar sintaxe
echo ""
echo "4️⃣ Verificando sintaxe..."
if php -l bootstrap/app.php 2>&1 | grep -q "No syntax errors"; then
    echo "✅ Sintaxe OK!"
else
    echo "❌ Ainda há erro:"
    php -l bootstrap/app.php
    echo ""
    echo "📄 Mostrando seção corrigida:"
    sed -n '17,30p' bootstrap/app.php
    echo ""
    echo "⚠️  Pode ser necessário editar manualmente: nano bootstrap/app.php"
    exit 1
fi

# 5. Mostrar seção corrigida
echo ""
echo "5️⃣ Seção corrigida (linhas 17-30):"
sed -n '17,30p' bootstrap/app.php

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
    echo "✅ Endpoint respondendo!"
else
    echo "⚠️  Endpoint retornou código $HTTP_CODE"
fi

echo ""
echo "✅ Correção concluída!"

