#!/bin/bash

# Script para enviar arquivos necessários para /tmp no servidor
# Execute manualmente no servidor depois

set -e

SERVER_HOST="10.102.0.103"
SERVER_PORT="63022"
SERVER_USER="darley"
SERVER_PASS="yhvh77"

echo "📤 Enviando arquivos para /tmp no servidor..."
echo ""

# Verificar se sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass não está instalado"
    echo "   Instale com: sudo apt-get install sshpass"
    exit 1
fi

# 1. Processar CSV localmente (se ainda não foi processado)
if [ ! -f "/tmp/medicamentos_processados.csv" ]; then
    echo "📊 Processando CSV localmente primeiro..."
    ./scripts/IMPORTAR_MEDICAMENTOS_OTIMIZADO.sh
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao processar CSV"
        exit 1
    fi
    echo ""
fi

# 2. Copiar CSV processado
echo "📤 Copiando CSV processado..."
sshpass -p "$SERVER_PASS" scp -P "$SERVER_PORT" -o StrictHostKeyChecking=no "/tmp/medicamentos_processados.csv" "$SERVER_USER@$SERVER_HOST:/tmp/medicamentos_processados.csv"
echo "   ✅ CSV copiado"

# 3. Copiar comando otimizado
echo "📤 Copiando comando ImportMedicationsFast.php..."
sshpass -p "$SERVER_PASS" scp -P "$SERVER_PORT" -o StrictHostKeyChecking=no "backend-laravel/app/Console/Commands/ImportMedicationsFast.php" "$SERVER_USER@$SERVER_HOST:/tmp/ImportMedicationsFast.php"
echo "   ✅ Comando copiado"

# 4. Copiar script de execução
echo "📤 Copiando script de execução..."
sshpass -p "$SERVER_PASS" scp -P "$SERVER_PORT" -o StrictHostKeyChecking=no "scripts/EXECUTAR_IMPORTACAO_OTIMIZADA_SERVIDOR.sh" "$SERVER_USER@$SERVER_HOST:/tmp/EXECUTAR_IMPORTACAO_OTIMIZADA_SERVIDOR.sh"
echo "   ✅ Script copiado"

echo ""
echo "✅ Todos os arquivos foram copiados para /tmp no servidor!"
echo ""
echo "📝 Para executar no servidor, conecte-se e execute:"
echo ""
echo "   ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST"
echo "   chmod +x /tmp/EXECUTAR_IMPORTACAO_OTIMIZADA_SERVIDOR.sh"
echo "   /tmp/EXECUTAR_IMPORTACAO_OTIMIZADA_SERVIDOR.sh"
echo ""
echo "   OU execute manualmente:"
echo ""
echo "   cd /var/www/lacos-backend"
echo "   sudo cp /tmp/ImportMedicationsFast.php app/Console/Commands/"
echo "   composer dump-autoload"
echo "   php artisan medications:import-fast /tmp/medicamentos_processados.csv"
echo ""







