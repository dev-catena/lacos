#!/bin/bash

# Script para configurar .env com MySQL
# Credenciais: DB=lacos, USER=lacos, PASS=Lacos2025Secure

echo "🔧 Configurando .env para MySQL..."

# Encontrar o diretório do backend
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
        break
    fi
done

if [ -z "$BACKEND_PATH" ]; then
    echo "❌ Backend Laravel não encontrado!"
    exit 1
fi

cd "$BACKEND_PATH" || exit 1

# Verificar se .env existe
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Arquivo .env criado a partir de .env.example"
    else
        echo "❌ Arquivo .env.example não encontrado!"
        exit 1
    fi
fi

# Configurar MySQL
echo ""
echo "📝 Configurando credenciais MySQL..."

# Atualizar ou adicionar configurações
if grep -q "^DB_CONNECTION=" .env; then
    sed -i 's/^DB_CONNECTION=.*/DB_CONNECTION=mysql/' .env
else
    echo "DB_CONNECTION=mysql" >> .env
fi

if grep -q "^DB_HOST=" .env; then
    sed -i 's/^DB_HOST=.*/DB_HOST=127.0.0.1/' .env
else
    echo "DB_HOST=127.0.0.1" >> .env
fi

if grep -q "^DB_PORT=" .env; then
    sed -i 's/^DB_PORT=.*/DB_PORT=3306/' .env
else
    echo "DB_PORT=3306" >> .env
fi

if grep -q "^DB_DATABASE=" .env; then
    sed -i 's/^DB_DATABASE=.*/DB_DATABASE=lacos/' .env
else
    echo "DB_DATABASE=lacos" >> .env
fi

if grep -q "^DB_USERNAME=" .env; then
    sed -i 's/^DB_USERNAME=.*/DB_USERNAME=lacos/' .env
else
    echo "DB_USERNAME=lacos" >> .env
fi

if grep -q "^DB_PASSWORD=" .env; then
    sed -i 's/^DB_PASSWORD=.*/DB_PASSWORD=Lacos2025Secure/' .env
else
    echo "DB_PASSWORD=Lacos2025Secure" >> .env
fi

echo ""
echo "✅ Configuração do MySQL aplicada:"
echo "   DB_CONNECTION=mysql"
echo "   DB_DATABASE=lacos"
echo "   DB_USERNAME=lacos"
echo "   DB_PASSWORD=Lacos2025Secure"
echo ""
echo "🔍 Verificando conexão com o banco..."

# Testar conexão
if command -v mysql &> /dev/null; then
    if mysql -u lacos -p'Lacos2025Secure' lacos -e "SELECT 1;" &> /dev/null; then
        echo "✅ Conexão com MySQL bem-sucedida!"
    else
        echo "⚠️  Não foi possível conectar ao MySQL"
        echo "   Verifique se:"
        echo "   1. O banco 'lacos' existe"
        echo "   2. O usuário 'lacos' tem permissões"
        echo "   3. A senha está correta"
    fi
else
    echo "⚠️  Comando mysql não encontrado (pode estar tudo certo, apenas não há cliente MySQL instalado)"
fi

echo ""
echo "✨ Configuração concluída!"




