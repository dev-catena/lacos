#!/bin/bash

# Script para importar medicamentos da ANVISA no servidor remoto
# Usa sshpass para autenticação automática

set -e

# Configurações do servidor
SERVER_HOST="192.168.0.20"
SERVER_PORT="63022"
SERVER_USER="darley"
SERVER_PASS="yhvh77"
SERVER_TMP="/tmp"
SERVER_BACKEND="/var/www/lacos-backend"

# Arquivos locais
CSV_FILE="scripts/DADOS_ABERTOS_MEDICAMENTOS.csv"
CSV_NAME="DADOS_ABERTOS_MEDICAMENTOS.csv"

echo "📥 Importando medicamentos da ANVISA no servidor remoto..."
echo "   Servidor: $SERVER_USER@$SERVER_HOST:$SERVER_PORT"
echo ""

# Verificar se sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass não está instalado"
    echo "   Instale com: sudo apt-get install sshpass"
    exit 1
fi

# Verificar se o arquivo CSV existe localmente
if [ ! -f "$CSV_FILE" ]; then
    echo "❌ Erro: Arquivo não encontrado: $CSV_FILE"
    exit 1
fi

echo "✅ Arquivo encontrado: $CSV_FILE"
echo ""

# 1. Copiar CSV para /tmp no servidor
echo "📤 Copiando CSV para o servidor (/tmp)..."
sshpass -p "$SERVER_PASS" scp -P "$SERVER_PORT" -o StrictHostKeyChecking=no "$CSV_FILE" "$SERVER_USER@$SERVER_HOST:$SERVER_TMP/$CSV_NAME"

if [ $? -ne 0 ]; then
    echo "❌ Erro ao copiar arquivo para o servidor"
    exit 1
fi

echo "✅ Arquivo copiado para $SERVER_TMP/$CSV_NAME no servidor"
echo ""

# 2. Conectar ao servidor e executar importação
echo "🔄 Conectando ao servidor e executando importação..."
echo "   Isso pode levar alguns minutos (36.000+ registros)..."
echo ""

sshpass -p "$SERVER_PASS" ssh -p "$SERVER_PORT" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" << 'ENDSSH'
set -e

BACKEND_DIR="/var/www/lacos-backend"
CSV_FILE="/tmp/DADOS_ABERTOS_MEDICAMENTOS.csv"
TEMP_DIR="/tmp"

cd "$BACKEND_DIR" || {
    echo "❌ Erro: Não foi possível acessar $BACKEND_DIR"
    exit 1
}

echo "✅ Diretório do backend: $BACKEND_DIR"
echo ""

# Verificar se o arquivo existe
if [ ! -f "$CSV_FILE" ]; then
    echo "❌ Erro: Arquivo CSV não encontrado em $CSV_FILE"
    exit 1
fi

echo "✅ Arquivo CSV encontrado"
echo ""

# Verificar se a migration existe
MIGRATION_FILE="database/migrations/2024_12_20_000001_create_medication_catalog_table.php"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "⚠️  Migration não encontrada: $MIGRATION_FILE"
    echo "   Verificando se a tabela já existe..."
    
    # Verificar se tabela existe
    TABLE_EXISTS=$(php artisan tinker --execute="
        try {
            \$count = DB::table('medication_catalog')->count();
            echo 'EXISTS';
        } catch (\Exception \$e) {
            echo 'NOT_EXISTS';
        }
    " 2>/dev/null | grep -o "EXISTS" || echo "NOT_EXISTS")
    
    if [ "$TABLE_EXISTS" = "NOT_EXISTS" ]; then
        echo "❌ Tabela não existe e migration não encontrada"
        echo "   Você precisa copiar os arquivos do backend para o servidor primeiro"
        exit 1
    else
        echo "✅ Tabela já existe"
    fi
else
    echo "✅ Migration encontrada"
    
    # Verificar se a migration já foi executada
    if php artisan migrate:status 2>/dev/null | grep -q "medication_catalog"; then
        echo "✅ Tabela medication_catalog já existe"
    else
        echo "🔄 Executando migration..."
        php artisan migrate --path="$MIGRATION_FILE"
        if [ $? -ne 0 ]; then
            echo "❌ Erro ao executar migration"
            exit 1
        fi
        echo "✅ Migration executada com sucesso"
    fi
fi

echo ""
echo "🔄 Importando medicamentos do CSV..."
echo "   Arquivo: $CSV_FILE"
echo "   Isso pode levar vários minutos..."
echo ""

# Executar comando de importação
php artisan medications:import "$CSV_FILE" --chunk=1000

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Importação concluída com sucesso!"
    echo ""
    echo "📊 Estatísticas:"
    php artisan tinker --execute="
        \$total = DB::table('medication_catalog')->count();
        \$active = DB::table('medication_catalog')->where('is_active', true)->where('situacao_registro', 'VÁLIDO')->count();
        echo '   Total de medicamentos: ' . \$total . PHP_EOL;
        echo '   Medicamentos ativos: ' . \$active . PHP_EOL;
    "
    echo ""
    echo "🧹 Limpando arquivo temporário..."
    rm -f "$CSV_FILE"
    echo "✅ Arquivo temporário removido"
    echo ""
    echo "🎉 Pronto! Os medicamentos estão disponíveis na API."
    echo ""
    echo "📝 Teste a API:"
    echo "   GET http://192.168.0.20/api/medications/search?q=paracetamol"
    echo "   GET http://192.168.0.20/api/medications/stats"
else
    echo ""
    echo "❌ Erro na importação"
    exit 1
fi
ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Processo concluído com sucesso!"
else
    echo ""
    echo "❌ Erro durante a importação"
    exit 1
fi

