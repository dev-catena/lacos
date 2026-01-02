#!/bin/bash

# Script simplificado: apenas copia o CSV para /tmp no servidor
# Você executa os comandos manualmente no servidor

set -e

# Configurações do servidor
SERVER_HOST="193.203.182.22"
SERVER_PORT="63022"
SERVER_USER="darley"
SERVER_PASS="yhvh77"

CSV_FILE="scripts/DADOS_ABERTOS_MEDICAMENTOS.csv"
REMOTE_CSV="/tmp/DADOS_ABERTOS_MEDICAMENTOS.csv"

echo "📤 Copiando CSV para o servidor..."
echo "   Servidor: $SERVER_USER@$SERVER_HOST:$SERVER_PORT"
echo "   Destino: $REMOTE_CSV"
echo ""

# Verificar se sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass não está instalado"
    echo "   Instale com: sudo apt-get install sshpass"
    exit 1
fi

# Verificar se o arquivo CSV existe
if [ ! -f "$CSV_FILE" ]; then
    echo "❌ Erro: Arquivo não encontrado: $CSV_FILE"
    exit 1
fi

echo "✅ Arquivo CSV encontrado: $CSV_FILE"
echo ""

# Copiar CSV
echo "📤 Copiando arquivo..."
sshpass -p "$SERVER_PASS" scp -P "$SERVER_PORT" -o StrictHostKeyChecking=no "$CSV_FILE" "$SERVER_USER@$SERVER_HOST:$REMOTE_CSV"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ CSV copiado com sucesso para: $REMOTE_CSV"
    echo ""
    echo "📝 Próximos passos (execute no servidor):"
    echo ""
    echo "   1. Conecte-se ao servidor:"
    echo "      ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST"
    echo ""
    echo "   2. Vá para o diretório do backend:"
    echo "      cd /var/www/lacos-backend"
    echo ""
    echo "   3. Verifique se os arquivos necessários existem:"
    echo "      ls -la app/Console/Commands/ImportMedicationsFromCSV.php"
    echo "      ls -la app/Models/MedicationCatalog.php"
    echo "      ls -la database/migrations/2024_12_20_000001_create_medication_catalog_table.php"
    echo ""
    echo "   4. Se os arquivos não existirem, copie-os manualmente ou execute:"
    echo "      ./scripts/COPIAR_ARQUIVOS_BACKEND_SERVIDOR.sh"
    echo ""
    echo "   5. Execute composer dump-autoload para registrar o comando:"
    echo "      composer dump-autoload"
    echo ""
    echo "   6. Verifique se a migration foi executada:"
    echo "      php artisan migrate:status | grep medication_catalog"
    echo ""
    echo "   7. Se a tabela não existir, execute a migration:"
    echo "      php artisan migrate --path=database/migrations/2024_12_20_000001_create_medication_catalog_table.php"
    echo ""
    echo "   8. Execute a importação:"
    echo "      php artisan medications:import /tmp/DADOS_ABERTOS_MEDICAMENTOS.csv --chunk=1000"
    echo ""
    echo "   9. Verifique as estatísticas:"
    echo "      php artisan tinker --execute=\"echo 'Total: ' . DB::table('medication_catalog')->count();\""
    echo ""
else
    echo ""
    echo "❌ Erro ao copiar CSV"
    exit 1
fi


