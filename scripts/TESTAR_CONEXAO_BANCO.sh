#!/bin/bash

# Script para testar conexão com banco de dados local

echo "=========================================="
echo "🔍 TESTANDO CONEXÃO COM BANCO DE DADOS"
echo "=========================================="
echo ""

# Ler configurações do .env
ENV_FILE="/home/darley/lacos/backend-laravel/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Arquivo .env não encontrado: $ENV_FILE"
    exit 1
fi

# Extrair configurações
DB_HOST=$(grep "^DB_HOST=" "$ENV_FILE" | cut -d'=' -f2 | tr -d ' ')
DB_PORT=$(grep "^DB_PORT=" "$ENV_FILE" | cut -d'=' -f2 | tr -d ' ')
DB_DATABASE=$(grep "^DB_DATABASE=" "$ENV_FILE" | cut -d'=' -f2 | tr -d ' ')
DB_USERNAME=$(grep "^DB_USERNAME=" "$ENV_FILE" | cut -d'=' -f2 | tr -d ' ')
DB_PASSWORD=$(grep "^DB_PASSWORD=" "$ENV_FILE" | cut -d'=' -f2 | tr -d ' ')

echo "📋 Configurações do .env:"
echo "   DB_HOST: $DB_HOST"
echo "   DB_PORT: $DB_PORT"
echo "   DB_DATABASE: $DB_DATABASE"
echo "   DB_USERNAME: $DB_USERNAME"
echo "   DB_PASSWORD: ${DB_PASSWORD:0:3}***"
echo ""

# Testar conexão
echo "🔌 Testando conexão..."
if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p"$DB_PASSWORD" -e "USE $DB_DATABASE; SELECT 1;" 2>/dev/null; then
    echo "✅ Conexão com banco de dados OK!"
    echo ""
    
    # Verificar tabelas
    echo "📊 Tabelas no banco:"
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p"$DB_PASSWORD" -e "USE $DB_DATABASE; SHOW TABLES;" 2>/dev/null | head -20
    
    # Contar tabelas
    TABLE_COUNT=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p"$DB_PASSWORD" -e "USE $DB_DATABASE; SHOW TABLES;" 2>/dev/null | wc -l)
    echo ""
    echo "📈 Total de tabelas: $((TABLE_COUNT - 1))"
else
    echo "❌ Erro ao conectar com banco de dados"
    echo ""
    echo "💡 Possíveis causas:"
    echo "   - Credenciais incorretas no .env"
    echo "   - Banco de dados não existe"
    echo "   - MySQL não está rodando"
    echo "   - Usuário não tem permissões"
    echo ""
    echo "🔧 Para verificar:"
    echo "   mysql -u root -p -e 'SHOW DATABASES;'"
    echo "   mysql -u root -p -e \"SHOW GRANTS FOR '$DB_USERNAME'@'localhost';\""
fi

echo ""
echo "=========================================="






