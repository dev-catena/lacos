#!/bin/bash

# Script completo otimizado: processa localmente e importa no servidor
# Reduz tempo de 16h para alguns minutos

set -e

SERVER_HOST="193.203.182.22"
SERVER_PORT="63022"
SERVER_USER="darley"
SERVER_PASS="yhvh77"

echo "🚀 Importação Completa Otimizada de Medicamentos"
echo ""

# 1. Processar CSV localmente
echo "📊 PASSO 1: Processando CSV localmente..."
./scripts/IMPORTAR_MEDICAMENTOS_OTIMIZADO.sh

if [ $? -ne 0 ]; then
    echo "❌ Erro no processamento local"
    exit 1
fi

echo ""
echo "📤 PASSO 2: Copiando comando otimizado para o servidor..."
sshpass -p "$SERVER_PASS" scp -P "$SERVER_PORT" -o StrictHostKeyChecking=no "backend-laravel/app/Console/Commands/ImportMedicationsFast.php" "$SERVER_USER@$SERVER_HOST:/tmp/ImportMedicationsFast.php"

echo ""
echo "🔄 PASSO 3: Copiando script de execução para o servidor..."
sshpass -p "$SERVER_PASS" scp -P "$SERVER_PORT" -o StrictHostKeyChecking=no "scripts/EXECUTAR_IMPORTACAO_OTIMIZADA_SERVIDOR.sh" "$SERVER_USER@$SERVER_HOST:/tmp/EXECUTAR_IMPORTACAO_OTIMIZADA_SERVIDOR.sh"

echo ""
echo "🔄 PASSO 4: Executando importação no servidor..."
echo ""

sshpass -p "$SERVER_PASS" ssh -p "$SERVER_PORT" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "chmod +x /tmp/EXECUTAR_IMPORTACAO_OTIMIZADA_SERVIDOR.sh && /tmp/EXECUTAR_IMPORTACAO_OTIMIZADA_SERVIDOR.sh"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Importação otimizada concluída com sucesso!"
else
    echo ""
    echo "❌ Erro na importação"
    exit 1
fi

