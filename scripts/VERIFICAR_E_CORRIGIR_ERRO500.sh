#!/bin/bash

# Script para verificar e corrigir erro 500 após configuração CORS

set -e

cd /var/www/lacos-backend

echo "🔍 Verificando erro 500..."

# 1. Verificar logs
echo ""
echo "1️⃣ Verificando logs..."
if [ -f "storage/logs/laravel.log" ]; then
    echo "📄 Últimas linhas do log:"
    tail -30 storage/logs/laravel.log | grep -A 10 -B 10 "HandleCors\|Error\|Exception" || tail -20 storage/logs/laravel.log
else
    echo "⚠️  Log não encontrado"
fi

# 2. Verificar bootstrap/app.php
echo ""
echo "2️⃣ Verificando bootstrap/app.php..."
if [ -f "bootstrap/app.php" ]; then
    echo "📄 Verificando sintaxe..."
    php -l bootstrap/app.php || echo "❌ Erro de sintaxe encontrado!"
    
    echo ""
    echo "📄 Conteúdo relacionado a HandleCors:"
    grep -A 3 -B 3 "HandleCors" bootstrap/app.php || echo "HandleCors não encontrado"
    
    echo ""
    echo "📄 Verificando use statements:"
    grep "^use " bootstrap/app.php | tail -5
fi

# 3. Restaurar backup se existir
echo ""
echo "3️⃣ Verificando backups..."
if ls bootstrap/app.php.backup* 1> /dev/null 2>&1; then
    LATEST_BACKUP=$(ls -t bootstrap/app.php.backup* | head -1)
    echo "📦 Backup encontrado: $LATEST_BACKUP"
    echo "   Para restaurar: cp $LATEST_BACKUP bootstrap/app.php"
fi

# 4. Corrigir bootstrap/app.php manualmente
echo ""
echo "4️⃣ Corrigindo bootstrap/app.php..."

if [ -f "bootstrap/app.php" ]; then
    # Verificar se há erro de sintaxe
    if ! php -l bootstrap/app.php 2>&1 | grep -q "No syntax errors"; then
        echo "❌ Erro de sintaxe detectado!"
        
        # Tentar remover linhas problemáticas do HandleCors
        if grep -q "HandleCors" bootstrap/app.php; then
            echo "🗑️  Removendo linhas problemáticas do HandleCors..."
            # Remover use statement se estiver mal formatado
            sed -i '/use Illuminate.*HandleCors/d' bootstrap/app.php
            # Remover append se estiver mal formatado
            sed -i '/\$middleware->append(HandleCors/d' bootstrap/app.php
            sed -i '/HandleCors::class/d' bootstrap/app.php
            
            echo "✅ Linhas problemáticas removidas"
        fi
    fi
fi

# 5. Criar bootstrap/app.php correto (versão simplificada)
echo ""
echo "5️⃣ Criando versão corrigida do bootstrap/app.php..."

# Ler o arquivo atual
if [ -f "bootstrap/app.php" ]; then
    # Fazer backup
    cp bootstrap/app.php bootstrap/app.php.backup.manual.$(date +%s)
    
    # Verificar se é Laravel 11
    if grep -q "Application::configure" bootstrap/app.php || grep -q "->create()" bootstrap/app.php; then
        echo "✅ Laravel 11 detectado"
        
        # Adicionar HandleCors corretamente
        # Primeiro, adicionar use statement se não existir
        if ! grep -q "use Illuminate\\\\Http\\\\Middleware\\\\HandleCors" bootstrap/app.php; then
            # Adicionar após outros use statements
            LAST_USE=$(grep -n "^use " bootstrap/app.php | tail -1 | cut -d: -f1)
            if [ -n "$LAST_USE" ]; then
                sed -i "${LAST_USE}a\\use Illuminate\\Http\\Middleware\\HandleCors;" bootstrap/app.php
            fi
        fi
        
        # Adicionar ao middleware se withMiddleware existir
        if grep -q "->withMiddleware" bootstrap/app.php && ! grep -q "HandleCors::class" bootstrap/app.php; then
            # Encontrar a linha do withMiddleware e adicionar após
            MIDDLEWARE_LINE=$(grep -n "->withMiddleware" bootstrap/app.php | head -1 | cut -d: -f1)
            if [ -n "$MIDDLEWARE_LINE" ]; then
                # Adicionar após a linha do withMiddleware
                sed -i "${MIDDLEWARE_LINE}a\\        \$middleware->append(HandleCors::class);" bootstrap/app.php
            fi
        fi
    fi
fi

# 6. Verificar sintaxe novamente
echo ""
echo "6️⃣ Verificando sintaxe após correção..."
if php -l bootstrap/app.php 2>&1 | grep -q "No syntax errors"; then
    echo "✅ Sintaxe OK"
else
    echo "❌ Ainda há erro de sintaxe"
    php -l bootstrap/app.php
    echo ""
    echo "⚠️  Restaurando backup..."
    if ls bootstrap/app.php.backup* 1> /dev/null 2>&1; then
        LATEST_BACKUP=$(ls -t bootstrap/app.php.backup* | head -1)
        cp "$LATEST_BACKUP" bootstrap/app.php
        echo "✅ Backup restaurado"
    fi
fi

# 7. Limpar caches
echo ""
echo "7️⃣ Limpando caches..."
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true

# 8. Testar
echo ""
echo "8️⃣ Testando..."
sleep 1
curl -s -o /dev/null -w "%{http_code}" http://localhost/api/admin/login -X OPTIONS -H 'Origin: http://localhost:3000' || echo "Erro ao testar"

echo ""
echo "✅ Verificação concluída!"
echo ""
echo "📝 Se ainda houver erro 500:"
echo "   1. Verifique logs: tail -f storage/logs/laravel.log"
echo "   2. Verifique sintaxe: php -l bootstrap/app.php"
echo "   3. Restaure backup se necessário"

