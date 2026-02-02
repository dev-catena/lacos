#!/bin/bash

# Script para importar medicamentos da ANVISA para o banco de dados
# 
# ⚠️  ATENÇÃO: Este script deve ser executado NO SERVIDOR (10.102.0.103)
#    O banco de dados está no servidor, não localmente!
#
# Para executar no servidor:
#   1. Copie o CSV para o servidor: scp scripts/DADOS_ABERTOS_MEDICAMENTOS.csv usuario@10.102.0.103:/var/www/lacos-backend/
#   2. Conecte ao servidor: ssh usuario@10.102.0.103
#   3. Execute: cd /var/www/lacos-backend && php artisan medications:import DADOS_ABERTOS_MEDICAMENTOS.csv --chunk=1000
#
# Ou use o script: IMPORTAR_MEDICAMENTOS_ANVISA_SERVIDOR.sh (copie para o servidor)

set -e

echo "⚠️  ATENÇÃO: Este script deve ser executado NO SERVIDOR!"
echo ""
echo "📋 A importação deve acontecer no servidor (10.102.0.103)"
echo "   porque o banco de dados está lá."
echo ""
echo "📝 Para importar no servidor:"
echo ""
echo "   1. Copiar CSV para o servidor:"
echo "      scp scripts/DADOS_ABERTOS_MEDICAMENTOS.csv usuario@10.102.0.103:/var/www/lacos-backend/"
echo ""
echo "   2. Conectar ao servidor:"
echo "      ssh usuario@10.102.0.103"
echo ""
echo "   3. Executar no servidor:"
echo "      cd /var/www/lacos-backend"
echo "      php artisan migrate --path=database/migrations/2024_12_20_000001_create_medication_catalog_table.php"
echo "      php artisan medications:import DADOS_ABERTOS_MEDICAMENTOS.csv --chunk=1000"
echo ""
echo "📚 Veja o guia completo: guias/COMO_IMPORTAR_NO_SERVIDOR.md"
echo ""
read -p "Deseja continuar mesmo assim? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

cd /home/darley/lacos || exit 1

echo "📥 Importando medicamentos da ANVISA para o banco de dados..."
echo ""

# Verificar se o arquivo existe
CSV_FILE="scripts/DADOS_ABERTOS_MEDICAMENTOS.csv"
if [ ! -f "$CSV_FILE" ]; then
    echo "❌ Erro: Arquivo não encontrado: $CSV_FILE"
    exit 1
fi

echo "✅ Arquivo encontrado: $CSV_FILE"
echo ""

# Verificar se está no diretório do backend
if [ ! -d "backend-laravel" ]; then
    echo "❌ Erro: Diretório backend-laravel não encontrado"
    exit 1
fi

cd backend-laravel

echo "📊 Verificando se a migration já foi executada..."
if php artisan migrate:status | grep -q "medication_catalog"; then
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
echo "   Isso pode levar alguns minutos..."
echo ""

# Executar comando de importação
php artisan medications:import "../$CSV_FILE" --chunk=1000

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
    echo "   GET /api/medications/search?q=paracetamol"
    echo "   GET /api/medications/stats"
else
    echo ""
    echo "❌ Erro na importação"
    exit 1
fi

