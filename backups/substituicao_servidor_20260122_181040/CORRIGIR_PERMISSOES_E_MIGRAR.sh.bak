#!/bin/bash

# Script simples: apenas corrige permissões e executa migrations
# NÃO mexe no .env (já está configurado)

echo "🔍 Procurando diretório do backend Laravel..."

# Possíveis localizações
POSSIBLE_PATHS=(
    "/var/www/lacos-backend"
    "/home/darley/lacos-backend"
    "/home/darley/lacos/backend-laravel"
    "$(pwd)"
)

BACKEND_PATH=""

for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -d "$path" ] && [ -f "$path/artisan" ]; then
        BACKEND_PATH="$path"
        echo "✅ Backend encontrado em: $BACKEND_PATH"
        break
    fi
done

if [ -z "$BACKEND_PATH" ]; then
    echo "❌ Backend Laravel não encontrado!"
    exit 1
fi

cd "$BACKEND_PATH" || exit 1

echo ""
echo "📁 Diretório atual: $(pwd)"
echo ""

# Verificar se .env existe (apenas informativo)
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado!"
    exit 1
fi

echo "✅ Arquivo .env encontrado (será preservado)"
echo ""

# Corrigir permissões do storage
echo "🔧 Corrigindo permissões do storage..."
if [ -d "storage" ]; then
    sudo chmod -R 775 storage bootstrap/cache 2>/dev/null || chmod -R 775 storage bootstrap/cache
    sudo chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || {
        echo "⚠️  Não foi possível alterar o owner (pode precisar de sudo)"
        echo "   Execute manualmente: sudo chown -R www-data:www-data storage bootstrap/cache"
    }
    echo "✅ Permissões do storage corrigidas"
else
    echo "❌ Diretório storage não encontrado!"
    exit 1
fi

# Verificar se o diretório de logs existe e tem permissão
if [ ! -d "storage/logs" ]; then
    echo "📁 Criando diretório storage/logs..."
    mkdir -p storage/logs
    chmod 775 storage/logs
fi

# Verificar permissão de escrita no arquivo de log
if [ -f "storage/logs/laravel.log" ]; then
    if [ ! -w "storage/logs/laravel.log" ]; then
        echo "🔧 Corrigindo permissão do arquivo de log..."
        sudo chmod 664 storage/logs/laravel.log 2>/dev/null || chmod 664 storage/logs/laravel.log
        sudo chown www-data:www-data storage/logs/laravel.log 2>/dev/null || {
            echo "⚠️  Não foi possível alterar o owner do arquivo de log"
        }
    fi
else
    echo "📝 Criando arquivo de log..."
    touch storage/logs/laravel.log
    chmod 664 storage/logs/laravel.log
    sudo chown www-data:www-data storage/logs/laravel.log 2>/dev/null || {
        echo "⚠️  Não foi possível alterar o owner do arquivo de log"
    }
fi

echo ""
echo "🚀 Executando migrations..."
echo ""

# Executar migrations
php artisan migrate --force

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations executadas com sucesso!"
else
    echo ""
    echo "❌ Erro ao executar migrations!"
    echo ""
    echo "💡 Verifique:"
    echo "   1. As credenciais do banco no arquivo .env"
    echo "   2. Se o banco de dados existe"
    echo "   3. Se o usuário tem permissões adequadas"
    exit 1
fi

echo ""
echo "✨ Processo concluído!"




