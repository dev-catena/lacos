#!/bin/bash

# Script completo para instalar o sistema de sensor de queda no servidor
# Execute este script no servidor

echo "🚀 Instalando sistema completo de sensor de queda..."
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "artisan" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do Laravel (onde está o arquivo artisan)"
    exit 1
fi

# Verificar arquivos necessários
echo "🔍 Verificando arquivos..."

FILES=(
    "create_fall_sensor_data_table.php"
    "FallSensorData.php"
    "FallSensorController.php"
)

MISSING_FILES=0
for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Arquivo não encontrado: $file"
        MISSING_FILES=1
    else
        echo "✅ $file"
    fi
done

if [ $MISSING_FILES -eq 1 ]; then
    echo ""
    echo "❌ Alguns arquivos estão faltando. Copie-os para este diretório primeiro."
    exit 1
fi

echo ""
echo "📦 Copiando arquivos para os diretórios corretos..."

# Copiar Model
if [ ! -f "app/Models/FallSensorData.php" ]; then
    cp FallSensorData.php app/Models/FallSensorData.php
    echo "✅ Model copiado para app/Models/"
else
    echo "⚠️  Model já existe em app/Models/"
fi

# Copiar Controller
if [ ! -f "app/Http/Controllers/Api/FallSensorController.php" ]; then
    cp FallSensorController.php app/Http/Controllers/Api/FallSensorController.php
    echo "✅ Controller copiado para app/Http/Controllers/Api/"
else
    echo "⚠️  Controller já existe em app/Http/Controllers/Api/"
fi

# Verificar sintaxe
echo ""
echo "🔍 Verificando sintaxe PHP..."

php -l app/Models/FallSensorData.php > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Sintaxe do Model OK"
else
    echo "❌ Erro de sintaxe no Model"
    php -l app/Models/FallSensorData.php
    exit 1
fi

php -l app/Http/Controllers/Api/FallSensorController.php > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Sintaxe do Controller OK"
else
    echo "❌ Erro de sintaxe no Controller"
    php -l app/Http/Controllers/Api/FallSensorController.php
    exit 1
fi

# Executar migration
echo ""
echo "🗄️  Executando migration..."

mkdir -p database/migrations
TIMESTAMP=$(date +%Y_%m_%d_%H%M%S)
MIGRATION_FILE="database/migrations/${TIMESTAMP}_create_fall_sensor_data_table.php"

if [ ! -f "$MIGRATION_FILE" ]; then
    cp create_fall_sensor_data_table.php "$MIGRATION_FILE"
    echo "✅ Migration copiada para: $MIGRATION_FILE"
fi

php -l "$MIGRATION_FILE" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Sintaxe da Migration OK"
else
    echo "❌ Erro de sintaxe na Migration"
    php -l "$MIGRATION_FILE"
    exit 1
fi

# Tentar executar migration
echo ""
echo "🚀 Executando migration..."

# Primeiro tentar sem sudo
php artisan migrate --path="$MIGRATION_FILE" --force 2>&1 | tee /tmp/migration_output.log

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo ""
    echo "⚠️  Erro ao executar migration. Verificando problema..."
    
    # Verificar se é problema de permissão
    if grep -q "Access denied" /tmp/migration_output.log; then
        echo ""
        echo "💡 Problema de acesso ao banco de dados detectado."
        echo "   Tentando executar com usuário www-data..."
        echo ""
        
        sudo -u www-data php artisan migrate --path="$MIGRATION_FILE" --force 2>&1
        
        if [ $? -ne 0 ]; then
            echo ""
            echo "❌ Ainda há problemas. Verifique:"
            echo "   1. Credenciais do banco no arquivo .env"
            echo "   2. Permissões do usuário do banco de dados"
            echo "   3. Se o banco de dados 'laravel' existe"
            echo ""
            echo "   Para verificar o .env:"
            echo "   grep DB_ .env"
            exit 1
        fi
    else
        echo ""
        echo "❌ Erro ao executar migration. Verifique os logs acima."
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
echo "📋 Verificando rotas..."

# Verificar rotas
ROUTES_FILE=""
if [ -f "routes/api.php" ]; then
    ROUTES_FILE="routes/api.php"
elif [ -f "routes_api_corrigido.php" ]; then
    ROUTES_FILE="routes_api_corrigido.php"
fi

if [ -n "$ROUTES_FILE" ]; then
    if grep -q "FallSensorController" "$ROUTES_FILE"; then
        echo "✅ Rotas encontradas no arquivo: $ROUTES_FILE"
    else
        echo "⚠️  ATENÇÃO: Rotas não encontradas no arquivo: $ROUTES_FILE"
        echo ""
        echo "   Adicione manualmente as seguintes rotas no grupo auth:sanctum:"
        echo ""
        echo "   use App\\Http\\Controllers\\Api\\FallSensorController;"
        echo ""
        echo "   Route::post('/groups/{groupId}/fall-sensor/data', [FallSensorController::class, 'store']);"
        echo "   Route::get('/groups/{groupId}/fall-sensor/history', [FallSensorController::class, 'index']);"
        echo "   Route::get('/groups/{groupId}/fall-sensor/latest', [FallSensorController::class, 'getLatest']);"
        echo "   Route::get('/groups/{groupId}/fall-sensor/alerts', [FallSensorController::class, 'getFallAlerts']);"
    fi
else
    echo "⚠️  Arquivo de rotas não encontrado"
fi

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Verifique se as rotas foram adicionadas"
echo "   2. Teste a API usando Postman ou similar"
echo "   3. No app mobile, teste a conexão com o sensor"
echo ""

