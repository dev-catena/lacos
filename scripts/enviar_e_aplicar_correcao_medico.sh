#!/bin/bash

# Script para enviar e aplicar correção de validação de grupo para médicos no servidor

set -e

# Configurações
SERVER_USER="darley"
SERVER_HOST="192.168.0.20"
SERVER_PASS="yhvh77"
SCRIPT_NAME="aplicar_correcao_servidor.sh"

echo "🚀 Enviando e aplicando correção de validação de grupo para médicos..."
echo "📡 Servidor: $SERVER_USER@$SERVER_HOST"
echo ""

# Verificar se sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass não está instalado. Instalando..."
    sudo apt-get update && sudo apt-get install -y sshpass
fi

# Verificar se o script existe
if [ ! -f "$SCRIPT_NAME" ]; then
    echo "❌ Script não encontrado: $SCRIPT_NAME"
    exit 1
fi

# Enviar script para o servidor
echo "📤 Enviando script para o servidor..."
sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$SCRIPT_NAME" "${SERVER_USER}@${SERVER_HOST}:/tmp/" 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Erro ao enviar script para o servidor"
    exit 1
fi

echo "✅ Script enviado"
echo ""

# Executar no servidor com timeout
echo "▶️  Executando correção no servidor..."
echo "   (Isso pode levar alguns segundos...)"
echo ""

# Verificar se o arquivo pode ser escrito sem sudo (ajustar permissões se necessário)
# Executar com timeout de 60 segundos e redirecionar stderr para stdout para ver todos os logs
timeout 60 sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "${SERVER_USER}@${SERVER_HOST}" "chmod +x /tmp/$SCRIPT_NAME && cd /var/www/lacos-backend && sudo chmod 666 app/Http/Controllers/Api/PrescriptionController.php 2>/dev/null || true && bash /tmp/$SCRIPT_NAME 2>&1"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 124 ]; then
    echo ""
    echo "⏱️  Timeout: O script demorou mais de 60 segundos"
    echo "💡 Tente executar manualmente no servidor:"
    echo "   ssh ${SERVER_USER}@${SERVER_HOST}"
    echo "   bash /tmp/$SCRIPT_NAME"
    exit 1
elif [ $EXIT_CODE -ne 0 ]; then
    echo ""
    echo "❌ Erro durante a execução (código: $EXIT_CODE)"
    exit 1
fi

echo ""
echo "✅ Processo concluído com sucesso!"
 