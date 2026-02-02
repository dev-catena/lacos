#!/bin/bash

# Script para corrigir diretório temp e permissões para geração de atestados
# Execute este script NO SERVIDOR onde está o backend Laravel

set -e

echo "🔧 Corrigindo diretório temp e permissões para atestados..."
echo ""

# Tentar encontrar o diretório do projeto
PROJECT_DIR=""
POSSIBLE_PATHS=(
    "/var/www/lacos-backend"
    "$HOME/lacos-backend"
    "$(pwd)"
)

for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -d "$path" ] && [ -f "$path/artisan" ]; then
        PROJECT_DIR="$path"
        echo "✅ Projeto encontrado em: $PROJECT_DIR"
        break
    fi
done

if [ -z "$PROJECT_DIR" ]; then
    echo "❌ Não foi possível encontrar o projeto Laravel"
    echo "📂 Procurando..."
    find /var/www -name "artisan" 2>/dev/null | head -5
    exit 1
fi

cd "$PROJECT_DIR" || exit 1
echo "📂 Diretório atual: $(pwd)"
echo ""

# Criar diretório temp se não existir
echo "1️⃣ Criando diretório storage/app/temp..."
sudo mkdir -p storage/app/temp
echo "✅ Diretório criado"
echo ""

# Corrigir permissões
echo "2️⃣ Corrigindo permissões do diretório temp..."
sudo chown -R www-data:www-data storage/app/temp
sudo chmod -R 775 storage/app/temp
echo "✅ Permissões corrigidas (775)"
echo ""

# Verificar se consegue escrever
echo "3️⃣ Testando escrita no diretório temp..."
TEST_FILE="storage/app/temp/test_$(date +%s).txt"
if sudo -u www-data touch "$TEST_FILE" 2>/dev/null; then
    sudo rm -f "$TEST_FILE"
    echo "✅ Teste de escrita OK"
else
    echo "⚠️  Problema com permissões, tentando modo mais permissivo..."
    sudo chmod -R 777 storage/app/temp
    if sudo -u www-data touch "$TEST_FILE" 2>/dev/null; then
        sudo rm -f "$TEST_FILE"
        echo "✅ Teste de escrita OK (modo 777)"
    else
        echo "❌ Ainda há problemas de permissão"
        exit 1
    fi
fi
echo ""

# Criar também outros diretórios necessários do storage
echo "4️⃣ Criando estrutura completa do storage..."
sudo mkdir -p storage/app/public
sudo mkdir -p storage/framework/cache
sudo mkdir -p storage/framework/sessions
sudo mkdir -p storage/framework/views
sudo mkdir -p storage/logs
echo "✅ Estrutura criada"
echo ""

# Corrigir permissões de toda a estrutura storage
echo "5️⃣ Corrigindo permissões de toda a estrutura storage..."
sudo chown -R www-data:www-data storage
sudo chmod -R 775 storage
sudo chmod -R 777 storage/app/temp  # temp precisa ser mais permissivo
echo "✅ Permissões corrigidas"
echo ""

# Limpar cache do Laravel
echo "6️⃣ Limpando cache do Laravel..."
sudo -u www-data php artisan config:clear 2>/dev/null || php artisan config:clear
sudo -u www-data php artisan cache:clear 2>/dev/null || php artisan cache:clear
echo "✅ Cache limpo"
echo ""

echo "✅ Correção concluída com sucesso!"
echo ""
echo "📋 O que foi feito:"
echo "  - Criado diretório storage/app/temp"
echo "  - Corrigidas permissões (www-data:www-data, 775)"
echo "  - Testada escrita no diretório"
echo "  - Cache do Laravel limpo"
echo ""
echo "🧪 Para testar:"
echo "  1. Tente gerar um atestado novamente"
echo "  2. O erro 'No such file or directory' não deve mais aparecer"

