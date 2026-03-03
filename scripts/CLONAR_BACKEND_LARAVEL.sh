#!/bin/bash

# Script para clonar o backend Laravel completo do repositório

set -e

PROJECT_DIR="/home/darley/lacos"
BACKEND_DIR="$PROJECT_DIR/backend-laravel-completo"
REPO_URL="https://github.com/dev-catena/gateway-lacos-.git"

echo "=========================================="
echo "📥 CLONANDO BACKEND LARAVEL COMPLETO"
echo "=========================================="
echo ""

# Verificar se já existe
if [ -d "$BACKEND_DIR" ] && [ -f "$BACKEND_DIR/artisan" ]; then
    echo "✅ Backend Laravel já existe em: $BACKEND_DIR"
    echo ""
    read -p "Deseja atualizar? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo "🔄 Atualizando..."
        cd "$BACKEND_DIR"
        git pull
    else
        echo "✅ Usando backend existente"
        exit 0
    fi
else
    echo "📥 Clonando repositório..."
    cd "$PROJECT_DIR"
    
    # Fazer backup do backend-laravel atual se existir
    if [ -d "backend-laravel" ] && [ ! -d "backend-laravel-completo" ]; then
        echo "💾 Fazendo backup do backend-laravel atual..."
        mv backend-laravel backend-laravel-backup-$(date +%Y%m%d_%H%M%S)
    fi
    
    # Clonar repositório
    git clone "$REPO_URL" backend-laravel-completo
    
    if [ $? -eq 0 ]; then
        echo "✅ Repositório clonado com sucesso!"
    else
        echo "❌ Erro ao clonar repositório"
        exit 1
    fi
fi

cd "$BACKEND_DIR"

echo ""
echo "📦 Instalando dependências..."
composer install

echo ""
echo "📋 Copiando .env do backup..."
if [ -f "$PROJECT_DIR/backend-laravel/.env" ]; then
    cp "$PROJECT_DIR/backend-laravel/.env" "$BACKEND_DIR/.env"
    echo "✅ .env copiado"
else
    echo "⚠️  .env não encontrado, criando do exemplo..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        php artisan key:generate
        echo "✅ .env criado"
    fi
fi

echo ""
echo "=========================================="
echo "✅ BACKEND LARAVEL PRONTO!"
echo "=========================================="
echo ""
echo "📂 Diretório: $BACKEND_DIR"
echo ""
echo "🚀 Para iniciar o servidor:"
echo "   cd $BACKEND_DIR"
echo "   php artisan serve --host 0.0.0.0 --port 8000"
echo ""












