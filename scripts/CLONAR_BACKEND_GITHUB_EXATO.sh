#!/bin/bash

# Script para clonar o backend do GitHub exatamente como está
# Mantém apenas o .env local

set -e

PROJECT_DIR="/home/darley/lacos"
BACKEND_ORIGINAL="$PROJECT_DIR/backend-laravel"
BACKEND_NOVO="$PROJECT_DIR/backend-laravel-github"
REPO_URL="https://github.com/dev-catena/gateway-lacos-.git"

echo "=========================================="
echo "📥 CLONANDO BACKEND DO GITHUB (EXATO)"
echo "=========================================="
echo ""
echo "📋 O projeto será exatamente igual ao GitHub"
echo "📋 Apenas o .env será mantido localmente"
echo ""

# Verificar se já existe
if [ -d "$BACKEND_NOVO" ]; then
    echo "⚠️  Diretório já existe: $BACKEND_NOVO"
    read -p "Deseja remover e clonar novamente? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo "🗑️  Removendo diretório existente..."
        rm -rf "$BACKEND_NOVO"
    else
        echo "✅ Usando diretório existente"
        cd "$BACKEND_NOVO"
        echo "🔄 Atualizando do GitHub..."
        git fetch origin
        git reset --hard origin/main
        git clean -fd
        echo "✅ Atualizado do GitHub"
    fi
else
    echo "📥 Clonando repositório do GitHub..."
    cd "$PROJECT_DIR"
    git clone "$REPO_URL" backend-laravel-github
    
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao clonar repositório"
        exit 1
    fi
    
    echo "✅ Repositório clonado!"
fi

cd "$BACKEND_NOVO"

echo ""
echo "📋 Verificando estrutura do projeto..."
if [ ! -f "artisan" ]; then
    echo "⚠️  Arquivo artisan não encontrado no repositório"
    echo "   O repositório pode não conter projeto Laravel completo"
    echo ""
    read -p "Deseja continuar mesmo assim? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
else
    echo "✅ Projeto Laravel encontrado!"
fi

echo ""
echo "📦 Instalando dependências..."
if [ -f "composer.json" ]; then
    composer install --no-interaction
    echo "✅ Dependências instaladas"
else
    echo "⚠️  composer.json não encontrado"
fi

echo ""
echo "📋 Configurando .env..."

# Salvar .env local se existir
ENV_LOCAL="$BACKEND_ORIGINAL/.env"
if [ -f "$ENV_LOCAL" ]; then
    echo "💾 Copiando .env local..."
    cp "$ENV_LOCAL" "$BACKEND_NOVO/.env"
    echo "✅ .env copiado do backup local"
    
    # Verificar se precisa gerar APP_KEY
    if ! grep -q "APP_KEY=base64:" "$BACKEND_NOVO/.env"; then
        echo "🔑 Gerando APP_KEY..."
        php artisan key:generate
    fi
else
    echo "⚠️  .env local não encontrado em: $ENV_LOCAL"
    if [ -f ".env.example" ]; then
        echo "📋 Criando .env do exemplo..."
        cp .env.example .env
        php artisan key:generate
        echo "✅ .env criado do exemplo"
        echo ""
        echo "⚠️  IMPORTANTE: Configure o .env com suas credenciais locais!"
    else
        echo "❌ .env.example não encontrado"
    fi
fi

echo ""
echo "🔍 Verificando status do Git..."
git status --short | head -10 || echo "   Repositório limpo"

echo ""
echo "=========================================="
echo "✅ BACKEND CLONADO DO GITHUB!"
echo "=========================================="
echo ""
echo "📂 Diretório: $BACKEND_NOVO"
echo "📋 Status: Exatamente igual ao GitHub"
echo "📋 .env: Mantido localmente"
echo ""
echo "🚀 Para iniciar o servidor:"
echo "   cd $BACKEND_NOVO"
if [ -f "$BACKEND_NOVO/artisan" ]; then
    echo "   php artisan serve --host 0.0.0.0 --port 8000"
else
    echo "   ⚠️  Arquivo artisan não encontrado - projeto pode não estar completo"
fi
echo ""
echo "📋 Para atualizar do GitHub no futuro:"
echo "   cd $BACKEND_NOVO"
echo "   git pull origin main"
echo ""






