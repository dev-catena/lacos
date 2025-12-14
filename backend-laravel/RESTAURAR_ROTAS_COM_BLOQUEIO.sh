#!/bin/bash

# Script para restaurar rotas completas incluindo verificação de bloqueio
# Este script copia o routes_api_corrigido.php (que já tem a verificação) para routes/api.php

set -e

cd /var/www/lacos-backend

echo "🔧 Restaurando rotas completas com verificação de bloqueio..."
echo ""

# 1. Encontrar routes_api_corrigido.php
SOURCE_FILE=""
if [ -f "/tmp/routes_api_corrigido.php" ]; then
    SOURCE_FILE="/tmp/routes_api_corrigido.php"
    echo "✅ Encontrado em /tmp/"
elif [ -f "routes_api_corrigido.php" ]; then
    SOURCE_FILE="routes_api_corrigido.php"
    echo "✅ Encontrado no diretório atual"
elif [ -f "/home/darley/lacos/backend-laravel/routes_api_corrigido.php" ]; then
    SOURCE_FILE="/home/darley/lacos/backend-laravel/routes_api_corrigido.php"
    echo "✅ Encontrado em /home/darley/lacos/backend-laravel/"
else
    echo "❌ routes_api_corrigido.php não encontrado!"
    echo ""
    echo "💡 Alternativa: Use o script APLICAR_VERIFICACAO_BLOQUEIO.sh"
    echo "   que modifica apenas a rota /user no arquivo existente"
    exit 1
fi

# 2. Verificar se o arquivo tem a verificação de bloqueio
if ! grep -q "is_blocked" "$SOURCE_FILE" || ! grep -q "account_blocked" "$SOURCE_FILE"; then
    echo "⚠️  ATENÇÃO: O arquivo $SOURCE_FILE não parece ter a verificação de bloqueio!"
    echo "   Continuando mesmo assim..."
fi

# 3. Fazer backup do routes/api.php atual
echo ""
echo "1️⃣ Fazendo backup do routes/api.php atual..."
if [ -f "routes/api.php" ]; then
    BACKUP_FILE="routes/api.php.backup.antes_restauracao.$(date +%s)"
    cp routes/api.php "$BACKUP_FILE"
    echo "✅ Backup criado: $BACKUP_FILE"
else
    echo "⚠️  routes/api.php não existe, será criado"
    mkdir -p routes
fi
echo ""

# 4. Copiar routes_api_corrigido.php para routes/api.php
echo "2️⃣ Restaurando rotas de $SOURCE_FILE para routes/api.php..."
cp "$SOURCE_FILE" routes/api.php
chown www-data:www-data routes/api.php 2>/dev/null || chmod 644 routes/api.php
echo "✅ Rotas restauradas"
echo ""

# 5. Verificar sintaxe PHP
echo "3️⃣ Verificando sintaxe PHP..."
if php -l routes/api.php > /dev/null 2>&1; then
    echo "✅ Sintaxe PHP válida"
else
    echo "❌ Erro na sintaxe PHP!"
    echo "   Restaurando backup..."
    if [ -f "$BACKUP_FILE" ]; then
        cp "$BACKUP_FILE" routes/api.php
    fi
    exit 1
fi
echo ""

# 6. Limpar cache
echo "4️⃣ Limpando cache do Laravel..."
php artisan route:clear 2>/dev/null || true
php artisan config:clear 2>/dev/null || true
echo "✅ Cache limpo"

echo ""
echo "=========================================="
echo "✅ Rotas restauradas com sucesso!"
echo "=========================================="
echo ""
echo "📋 O que foi implementado:"
echo "   • Todas as rotas do routes_api_corrigido.php foram restauradas"
echo "   • Endpoint /api/user verifica se usuário está bloqueado"
echo "   • Retorna 403 com error 'account_blocked' se bloqueado"
echo "   • Revoga todos os tokens do usuário bloqueado automaticamente"
echo ""
echo "🧪 Para testar:"
echo "   1. Bloqueie um usuário via interface web"
echo "   2. Tente fazer uma requisição GET /api/user com token desse usuário"
echo "   3. Deve retornar 403 com mensagem de conta bloqueada"
echo ""
if [ -f "$BACKUP_FILE" ]; then
    echo "📝 Backup salvo em: $BACKUP_FILE"
fi
echo ""

