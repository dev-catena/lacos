#!/bin/bash

# Script para instalação manual do sensor de queda
# Use este script se a migration automática não funcionar

echo "🚀 Instalação Manual do Sensor de Queda"
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "artisan" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do Laravel"
    exit 1
fi

echo "📦 Passo 1: Copiando arquivos..."

# Copiar Model
if [ -f "FallSensorData.php" ]; then
    mkdir -p app/Models
    cp FallSensorData.php app/Models/FallSensorData.php
    echo "✅ Model copiado"
else
    echo "⚠️  FallSensorData.php não encontrado"
fi

# Copiar Controller
if [ -f "FallSensorController.php" ]; then
    mkdir -p app/Http/Controllers/Api
    cp FallSensorController.php app/Http/Controllers/Api/FallSensorController.php
    echo "✅ Controller copiado"
else
    echo "⚠️  FallSensorController.php não encontrado"
fi

echo ""
echo "🗄️  Passo 2: Criando tabela no banco de dados..."
echo ""
echo "Escolha uma opção:"
echo "1) Executar SQL manualmente (recomendado se migration falhar)"
echo "2) Tentar migration com sudo -u www-data"
echo "3) Pular criação da tabela (você criará manualmente depois)"
read -p "Opção [1-3]: " option

case $option in
    1)
        echo ""
        echo "📝 Execute o seguinte comando:"
        echo "   sudo mysql -u root laravel < create_fall_sensor_data_table.sql"
        echo ""
        echo "Ou conecte ao MySQL e execute o SQL:"
        echo "   sudo mysql -u root"
        echo "   USE laravel;"
        echo "   SOURCE create_fall_sensor_data_table.sql;"
        ;;
    2)
        echo ""
        echo "🚀 Tentando executar migration com sudo -u www-data..."
        
        mkdir -p database/migrations
        TIMESTAMP=$(date +%Y_%m_%d_%H%M%S)
        MIGRATION_FILE="database/migrations/${TIMESTAMP}_create_fall_sensor_data_table.php"
        
        if [ -f "create_fall_sensor_data_table.php" ]; then
            cp create_fall_sensor_data_table.php "$MIGRATION_FILE"
            sudo -u www-data php artisan migrate --path="$MIGRATION_FILE" --force
            
            if [ $? -eq 0 ]; then
                echo "✅ Migration executada com sucesso!"
            else
                echo "❌ Migration falhou. Tente a opção 1 (SQL manual)"
            fi
        else
            echo "❌ Arquivo create_fall_sensor_data_table.php não encontrado"
        fi
        ;;
    3)
        echo "⚠️  Pulando criação da tabela. Crie manualmente depois."
        ;;
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac

echo ""
echo "📋 Passo 3: Verificando rotas..."
echo ""

ROUTES_FILE=""
if [ -f "routes/api.php" ]; then
    ROUTES_FILE="routes/api.php"
elif [ -f "routes_api_corrigido.php" ]; then
    ROUTES_FILE="routes_api_corrigido.php"
fi

if [ -n "$ROUTES_FILE" ]; then
    if grep -q "FallSensorController" "$ROUTES_FILE"; then
        echo "✅ Rotas já adicionadas em: $ROUTES_FILE"
    else
        echo "⚠️  Rotas não encontradas em: $ROUTES_FILE"
        echo ""
        echo "Adicione manualmente:"
        echo ""
        echo "No topo do arquivo (com os outros use):"
        echo "   use App\\Http\\Controllers\\Api\\FallSensorController;"
        echo ""
        echo "Dentro do grupo auth:sanctum:"
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
echo "   1. Verifique se a tabela foi criada: php artisan tinker -> DB::table('fall_sensor_data')->count();"
echo "   2. Verifique se as rotas foram adicionadas"
echo "   3. Teste a API"
echo ""

