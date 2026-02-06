#!/bin/bash

# Script para criar projeto Laravel completo e copiar arquivos do backend-laravel

set -e

PROJECT_DIR="/home/darley/lacos"
BACKEND_ORIGINAL="$PROJECT_DIR/backend-laravel"
BACKEND_NOVO="$PROJECT_DIR/backend-laravel-completo"

echo "=========================================="
echo "🚀 CRIANDO BACKEND LARAVEL COMPLETO"
echo "=========================================="
echo ""

# Verificar se Composer está instalado
if ! command -v composer &> /dev/null; then
    echo "❌ Composer não está instalado!"
    echo "   Instale o Composer: https://getcomposer.org/download/"
    exit 1
fi

echo "✅ Composer encontrado"
echo ""

# Verificar se já existe
if [ -d "$BACKEND_NOVO" ] && [ -f "$BACKEND_NOVO/artisan" ]; then
    echo "⚠️  Backend Laravel completo já existe em: $BACKEND_NOVO"
    read -p "Deseja recriar? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "✅ Usando backend existente"
        exit 0
    else
        echo "🗑️  Removendo backend existente..."
        rm -rf "$BACKEND_NOVO"
    fi
fi

# Criar projeto Laravel
echo "📦 Criando projeto Laravel..."
cd "$PROJECT_DIR"
composer create-project laravel/laravel backend-laravel-completo

if [ $? -ne 0 ]; then
    echo "❌ Erro ao criar projeto Laravel"
    exit 1
fi

cd "$BACKEND_NOVO"

echo ""
echo "📋 Copiando arquivos do backend-laravel..."

# Copiar .env
if [ -f "$BACKEND_ORIGINAL/.env" ]; then
    cp "$BACKEND_ORIGINAL/.env" "$BACKEND_NOVO/.env"
    echo "✅ .env copiado"
else
    echo "⚠️  .env não encontrado, usando .env.example"
    cp .env.example .env
    php artisan key:generate
fi

# Copiar controllers
if [ -d "$BACKEND_ORIGINAL/app/Http/Controllers" ]; then
    echo "📁 Copiando controllers..."
    mkdir -p app/Http/Controllers/Api
    cp -r "$BACKEND_ORIGINAL/app/Http/Controllers/Api/"* app/Http/Controllers/Api/ 2>/dev/null || true
    echo "✅ Controllers copiados"
fi

# Copiar services
if [ -d "$BACKEND_ORIGINAL/app/Services" ]; then
    echo "📁 Copiando services..."
    mkdir -p app/Services
    cp -r "$BACKEND_ORIGINAL/app/Services/"* app/Services/ 2>/dev/null || true
    echo "✅ Services copiados"
fi

# Copiar models
if [ -d "$BACKEND_ORIGINAL/app/Models" ]; then
    echo "📁 Copiando models..."
    mkdir -p app/Models
    cp -r "$BACKEND_ORIGINAL/app/Models/"* app/Models/ 2>/dev/null || true
    echo "✅ Models copiados"
fi

# Copiar migrations
if [ -d "$BACKEND_ORIGINAL/database/migrations" ]; then
    echo "📁 Copiando migrations..."
    cp -r "$BACKEND_ORIGINAL/database/migrations/"* database/migrations/ 2>/dev/null || true
    echo "✅ Migrations copiadas"
fi

# Copiar rotas
if [ -f "$BACKEND_ORIGINAL/routes/api.php" ]; then
    echo "📁 Copiando rotas..."
    cp "$BACKEND_ORIGINAL/routes/api.php" routes/api.php
    echo "✅ Rotas copiadas"
fi

# Copiar configurações
if [ -d "$BACKEND_ORIGINAL/config" ]; then
    echo "📁 Copiando configurações..."
    cp -r "$BACKEND_ORIGINAL/config/"* config/ 2>/dev/null || true
    echo "✅ Configurações copiadas"
fi

echo ""
echo "📦 Instalando dependências adicionais..."
composer install

echo ""
echo "🔑 Gerando chave da aplicação..."
php artisan key:generate

echo ""
echo "=========================================="
echo "✅ BACKEND LARAVEL CRIADO!"
echo "=========================================="
echo ""
echo "📂 Diretório: $BACKEND_NOVO"
echo ""
echo "🚀 Para iniciar o servidor:"
echo "   cd $BACKEND_NOVO"
echo "   php artisan serve --host 0.0.0.0 --port 8000"
echo ""
echo "📋 Próximos passos:"
echo "   1. Verificar .env (já copiado)"
echo "   2. Executar migrations: php artisan migrate"
echo "   3. Iniciar servidor: php artisan serve"
echo ""









