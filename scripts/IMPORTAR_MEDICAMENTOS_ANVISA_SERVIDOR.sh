#!/bin/bash

# Script para importar medicamentos da ANVISA no SERVIDOR
# Este script deve ser executado NO SERVIDOR (192.168.0.20)
# 
# Uso no servidor:
#   1. Copiar CSV para o servidor
#   2. Executar este script no servidor

set -e

echo "📥 Importando medicamentos da ANVISA para o banco de dados do SERVIDOR..."
echo "⚠️  Este script deve ser executado NO SERVIDOR (192.168.0.20)"
echo ""

# Verificar se está no servidor (ajustar caminho conforme necessário)
BACKEND_DIR="/var/www/lacos-backend"
CSV_FILE="/var/www/lacos-backend/DADOS_ABERTOS_MEDICAMENTOS.csv"

# Verificar se o diretório do backend existe
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Erro: Diretório do backend não encontrado: $BACKEND_DIR"
    echo "   Verifique se você está no servidor correto"
    exit 1
fi

cd "$BACKEND_DIR" || exit 1

# Verificar se o arquivo CSV existe
if [ ! -f "$CSV_FILE" ]; then
    echo "⚠️  Arquivo CSV não encontrado em: $CSV_FILE"
    echo ""
    echo "📋 Você precisa copiar o arquivo CSV para o servidor primeiro:"
    echo "   scp scripts/DADOS_ABERTOS_MEDICAMENTOS.csv usuario@192.168.0.20:/var/www/lacos-backend/"
    echo ""
    read -p "Deseja continuar mesmo assim? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    
    # Tentar encontrar o arquivo em outros locais
    CSV_FILE=$(find . -name "DADOS_ABERTOS_MEDICAMENTOS.csv" 2>/dev/null | head -1)
    if [ -z "$CSV_FILE" ]; then
        echo "❌ Arquivo CSV não encontrado"
        exit 1
    fi
    echo "✅ Arquivo encontrado em: $CSV_FILE"
fi

echo "✅ Arquivo encontrado: $CSV_FILE"
echo ""

# Verificar se a migration já foi executada
echo "📊 Verificando se a migration já foi executada..."
if php artisan migrate:status 2>/dev/null | grep -q "medication_catalog"; then
    echo "✅ Tabela medication_catalog já existe"
else
    echo "🔄 Executando migration..."
    php artisan migrate --path=database/migrations/2024_12_20_000001_create_medication_catalog_table.php
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao executar migration"
        exit 1
    fi
    echo "✅ Migration executada com sucesso"
fi

echo ""
echo "🔄 Importando medicamentos do CSV..."
echo "   Isso pode levar alguns minutos (36.000+ registros)..."
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







