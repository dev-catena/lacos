#!/bin/bash

# Script para completar o backend-laravel com arquivos necessários do Laravel
# Mantém tudo na pasta backend-laravel (não cria pasta nova)

set -e

PROJECT_DIR="/home/darley/lacos"
BACKEND_DIR="$PROJECT_DIR/backend-laravel"
TEMP_DIR="$PROJECT_DIR/backend-laravel-temp"

echo "=========================================="
echo "🔧 COMPLETANDO BACKEND LARAVEL"
echo "=========================================="
echo ""
echo "📋 Adicionando arquivos necessários do Laravel"
echo "📋 Mantendo tudo em: backend-laravel"
echo ""

# Verificar se Composer está instalado
if ! command -v composer &> /dev/null; then
    echo "❌ Composer não está instalado!"
    echo "   Instale o Composer: https://getcomposer.org/download/"
    exit 1
fi

echo "✅ Composer encontrado"
echo ""

# Verificar se backend-laravel existe
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Diretório backend-laravel não encontrado!"
    exit 1
fi

cd "$BACKEND_DIR"

# Verificar se já tem artisan
if [ -f "artisan" ] && [ -f "composer.json" ]; then
    echo "✅ Backend já parece estar completo (artisan e composer.json encontrados)"
    read -p "Deseja recriar mesmo assim? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "✅ Mantendo backend atual"
        exit 0
    fi
fi

# Fazer backup do .env
ENV_BACKUP=""
if [ -f ".env" ]; then
    ENV_BACKUP="${BACKEND_DIR}/.env.backup.$(date +%Y%m%d_%H%M%S)"
    cp .env "$ENV_BACKUP"
    echo "💾 Backup do .env criado: $ENV_BACKUP"
fi

echo ""
echo "📦 Criando projeto Laravel temporário..."
cd "$PROJECT_DIR"

# Remover temp se existir
rm -rf "$TEMP_DIR"

# Criar projeto Laravel temporário
composer create-project laravel/laravel backend-laravel-temp --no-interaction

if [ $? -ne 0 ]; then
    echo "❌ Erro ao criar projeto Laravel"
    exit 1
fi

echo ""
echo "📋 Copiando arquivos necessários do Laravel para backend-laravel..."

# Copiar arquivos base do Laravel
cd "$BACKEND_DIR"

# Copiar artisan
if [ -f "$TEMP_DIR/artisan" ]; then
    cp "$TEMP_DIR/artisan" .
    echo "✅ artisan copiado"
fi

# Copiar composer.json (mas manter dependências existentes se houver)
if [ -f "$TEMP_DIR/composer.json" ]; then
    # Se já existe composer.json, fazer merge inteligente
    if [ -f "composer.json" ]; then
        echo "⚠️  composer.json já existe, mantendo o existente"
    else
        cp "$TEMP_DIR/composer.json" .
        echo "✅ composer.json copiado"
    fi
fi

# Copiar outros arquivos necessários
FILES_TO_COPY=(
    "bootstrap/app.php"
    "bootstrap/cache/.gitignore"
    "public/index.php"
    "public/.htaccess"
    "server.php"
    "vite.config.js"
    "package.json"
    "phpunit.xml"
    ".gitattributes"
)

for file in "${FILES_TO_COPY[@]}"; do
    if [ -f "$TEMP_DIR/$file" ]; then
        mkdir -p "$(dirname "$file")"
        cp "$TEMP_DIR/$file" "$file"
        echo "✅ $file copiado"
    fi
done

# Copiar diretórios necessários
DIRS_TO_COPY=(
    "bootstrap/cache"
    "public"
    "storage"
    "tests"
)

for dir in "${DIRS_TO_COPY[@]}"; do
    if [ -d "$TEMP_DIR/$dir" ] && [ ! -d "$dir" ]; then
        cp -r "$TEMP_DIR/$dir" .
        echo "✅ $dir copiado"
    fi
done

# Garantir que storage tem estrutura correta
mkdir -p storage/framework/{cache,sessions,views,testing}
mkdir -p storage/logs
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

echo ""
echo "📦 Instalando dependências..."
if [ -f "composer.json" ]; then
    composer install --no-interaction
    echo "✅ Dependências instaladas"
else
    echo "⚠️  composer.json não encontrado, pulando instalação"
fi

echo ""
echo "🔑 Configurando .env..."
if [ -f "$ENV_BACKUP" ]; then
    cp "$ENV_BACKUP" .env
    echo "✅ .env restaurado do backup"
    
    # Gerar APP_KEY se necessário
    if ! grep -q "APP_KEY=base64:" .env 2>/dev/null; then
        if [ -f "artisan" ]; then
            php artisan key:generate
            echo "✅ APP_KEY gerado"
        fi
    fi
elif [ -f ".env" ]; then
    echo "✅ .env já existe"
    if ! grep -q "APP_KEY=base64:" .env 2>/dev/null; then
        if [ -f "artisan" ]; then
            php artisan key:generate
            echo "✅ APP_KEY gerado"
        fi
    fi
else
    if [ -f ".env.example" ]; then
        cp .env.example .env
        if [ -f "artisan" ]; then
            php artisan key:generate
        fi
        echo "✅ .env criado do exemplo"
    fi
fi

echo ""
echo "🧹 Removendo diretório temporário..."
rm -rf "$TEMP_DIR"

echo ""
echo "🔍 Verificando estrutura final..."
if [ -f "artisan" ]; then
    echo "✅ artisan encontrado"
else
    echo "❌ artisan NÃO encontrado"
fi

if [ -f "composer.json" ]; then
    echo "✅ composer.json encontrado"
else
    echo "❌ composer.json NÃO encontrado"
fi

if [ -d "app" ]; then
    echo "✅ app/ encontrado"
fi

if [ -d "routes" ]; then
    echo "✅ routes/ encontrado"
fi

echo ""
echo "=========================================="
echo "✅ BACKEND LARAVEL COMPLETO!"
echo "=========================================="
echo ""
echo "📂 Diretório: $BACKEND_DIR"
echo ""
echo "🚀 Para iniciar o servidor:"
echo "   cd $BACKEND_DIR"
if [ -f "$BACKEND_DIR/artisan" ]; then
    echo "   php artisan serve --host 0.0.0.0 --port 8000"
else
    echo "   ⚠️  artisan não encontrado - verifique os erros acima"
fi
echo ""








