#!/bin/bash

# Script para instalar o sistema de sensor de queda no servidor
# Execute este script no servidor como usuário com permissões adequadas

echo "🚀 Instalando sistema de sensor de queda..."
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

# Verificar se o Model existe
if [ ! -f "FallSensorData.php" ]; then
    echo "❌ Erro: Arquivo FallSensorData.php não encontrado"
    echo "   Certifique-se de que o arquivo está no diretório raiz do Laravel"
    exit 1
fi

# Verificar se o Controller existe
if [ ! -f "FallSensorController.php" ]; then
    echo "❌ Erro: Arquivo FallSensorController.php não encontrado"
    echo "   Certifique-se de que o arquivo está no diretório raiz do Laravel"
    exit 1
fi

echo "📦 Copiando arquivos para os diretórios corretos..."

# Copiar Model para app/Models (se não existir)
if [ ! -f "app/Models/FallSensorData.php" ]; then
    cp FallSensorData.php app/Models/FallSensorData.php
    echo "✅ Model copiado para app/Models/"
else
    echo "⚠️  Model já existe em app/Models/"
fi

# Copiar Controller para app/Http/Controllers/Api (se não existir)
if [ ! -f "app/Http/Controllers/Api/FallSensorController.php" ]; then
    cp FallSensorController.php app/Http/Controllers/Api/FallSensorController.php
    echo "✅ Controller copiado para app/Http/Controllers/Api/"
else
    echo "⚠️  Controller já existe em app/Http/Controllers/Api/"
fi

# Mover migration para database/migrations com timestamp
if [ ! -f "database/migrations" ]; then
    mkdir -p database/migrations
fi

TIMESTAMP=$(date +%Y_%m_%d_%H%M%S)
MIGRATION_FILE="database/migrations/${TIMESTAMP}_create_fall_sensor_data_table.php"

if [ ! -f "$MIGRATION_FILE" ]; then
    cp create_fall_sensor_data_table.php "$MIGRATION_FILE"
    echo "✅ Migration copiada para $MIGRATION_FILE"
else
    echo "⚠️  Migration já existe: $MIGRATION_FILE"
fi

echo ""
echo "🔍 Verificando sintaxe PHP..."

# Verificar sintaxe do Model
php -l app/Models/FallSensorData.php > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Sintaxe do Model OK"
else
    echo "❌ Erro de sintaxe no Model"
    php -l app/Models/FallSensorData.php
    exit 1
fi

# Verificar sintaxe do Controller
php -l app/Http/Controllers/Api/FallSensorController.php > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Sintaxe do Controller OK"
else
    echo "❌ Erro de sintaxe no Controller"
    php -l app/Http/Controllers/Api/FallSensorController.php
    exit 1
fi

# Verificar sintaxe da Migration
php -l "$MIGRATION_FILE" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Sintaxe da Migration OK"
else
    echo "❌ Erro de sintaxe na Migration"
    php -l "$MIGRATION_FILE"
    exit 1
fi

echo ""
echo "🗄️  Executando migration..."

# Executar migration
php artisan migrate --path="$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Migration executada com sucesso!"
else
    echo "❌ Erro ao executar migration"
    echo "   Verifique os logs do Laravel para mais detalhes"
    exit 1
fi

echo ""
echo "🔍 Verificando se a tabela foi criada..."

php artisan tinker --execute="
try {
    \$count = DB::table('fall_sensor_data')->count();
    echo '✅ Tabela fall_sensor_data criada com sucesso! (Total de registros: ' . \$count . ')';
} catch (\Exception \$e) {
    echo '❌ Erro ao verificar tabela: ' . \$e->getMessage();
}
"

echo ""
echo "📋 Verificando rotas..."

# Verificar se as rotas foram adicionadas
if grep -q "FallSensorController" routes/api.php 2>/dev/null || grep -q "FallSensorController" routes_api_corrigido.php 2>/dev/null; then
    echo "✅ Rotas encontradas no arquivo de rotas"
else
    echo "⚠️  ATENÇÃO: Rotas não encontradas no arquivo de rotas"
    echo "   Adicione manualmente as seguintes rotas no grupo auth:sanctum:"
    echo ""
    echo "   Route::post('/groups/{groupId}/fall-sensor/data', [FallSensorController::class, 'store']);"
    echo "   Route::get('/groups/{groupId}/fall-sensor/history', [FallSensorController::class, 'index']);"
    echo "   Route::get('/groups/{groupId}/fall-sensor/latest', [FallSensorController::class, 'getLatest']);"
    echo "   Route::get('/groups/{groupId}/fall-sensor/alerts', [FallSensorController::class, 'getFallAlerts']);"
    echo ""
    echo "   E adicione o import no topo do arquivo:"
    echo "   use App\\Http\\Controllers\\Api\\FallSensorController;"
fi

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Verifique se as rotas foram adicionadas ao arquivo de rotas"
echo "   2. Teste a API usando Postman ou similar"
echo "   3. No app mobile, teste a conexão com o sensor WT901BLE67"
echo "   4. Verifique se os dados estão sendo salvos corretamente"
echo ""

