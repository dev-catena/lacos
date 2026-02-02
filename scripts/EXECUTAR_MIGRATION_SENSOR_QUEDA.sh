#!/bin/bash

# Script para executar a migration do sensor de queda no servidor
# Execute este script no servidor

echo "🚀 Executando migration do sensor de queda..."
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "artisan" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do Laravel (onde está o arquivo artisan)"
    exit 1
fi

# Verificar se o arquivo de migration existe
if [ ! -f "create_fall_sensor_data_table.php" ]; then
    echo "❌ Erro: Arquivo create_fall_sensor_data_table.php não encontrado"
    echo "   Certifique-se de que o arquivo está no diretório raiz do Laravel"
    exit 1
fi

echo "📦 Movendo migration para database/migrations/..."

# Criar diretório se não existir
mkdir -p database/migrations

# Gerar timestamp
TIMESTAMP=$(date +%Y_%m_%d_%H%M%S)
MIGRATION_FILE="database/migrations/${TIMESTAMP}_create_fall_sensor_data_table.php"

# Copiar migration
cp create_fall_sensor_data_table.php "$MIGRATION_FILE"
echo "✅ Migration copiada para: $MIGRATION_FILE"

echo ""
echo "🔍 Verificando sintaxe PHP..."
php -l "$MIGRATION_FILE" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Sintaxe OK"
else
    echo "❌ Erro de sintaxe"
    php -l "$MIGRATION_FILE"
    exit 1
fi

echo ""
echo "🗄️  Executando migration..."

# Tentar executar a migration
# Se falhar com permissão, tentar com sudo -u www-data
php artisan migrate --path="$MIGRATION_FILE" 2>&1

if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  Erro ao executar migration. Tentando com usuário www-data..."
    sudo -u www-data php artisan migrate --path="$MIGRATION_FILE" 2>&1
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ Erro ao executar migration"
        echo ""
        echo "💡 Possíveis soluções:"
        echo "   1. Verifique as credenciais do banco de dados no arquivo .env"
        echo "   2. Verifique se o usuário do banco tem permissões adequadas"
        echo "   3. Tente executar manualmente:"
        echo "      sudo -u www-data php artisan migrate --path=\"$MIGRATION_FILE\""
        echo "   4. Ou execute diretamente no MySQL:"
        echo "      mysql -u root -p laravel < create_fall_sensor_data_table.sql"
        exit 1
    fi
fi

echo ""
echo "✅ Migration executada com sucesso!"
echo ""
echo "🔍 Verificando se a tabela foi criada..."

php artisan tinker --execute="
try {
    \$count = DB::table('fall_sensor_data')->count();
    echo '✅ Tabela fall_sensor_data criada com sucesso! (Total de registros: ' . \$count . ')';
} catch (\Exception \$e) {
    echo '❌ Erro ao verificar tabela: ' . \$e->getMessage();
}
" 2>&1

echo ""
echo "📋 Próximos passos:"
echo "   1. Verifique se o Model e Controller foram copiados para os diretórios corretos"
echo "   2. Verifique se as rotas foram adicionadas ao arquivo de rotas"
echo "   3. Teste a API usando Postman ou similar"
echo ""

