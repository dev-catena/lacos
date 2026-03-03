#!/bin/bash

# Script para enviar CORRIGIR_PERMISSOES_PDF_BACKEND.sh para o servidor

set -e

SCRIPT_PATH="/home/darley/lacos/scripts/CORRIGIR_PERMISSOES_PDF_BACKEND.sh"
SSH_HOST="192.168.0.20"
SSH_PORT="63022"
SSH_USER="root"
DEST_PATH="/tmp/CORRIGIR_PERMISSOES_PDF_BACKEND.sh"

echo "📤 ENVIANDO SCRIPT PARA O SERVIDOR"
echo "==================================="
echo ""
echo "📋 Configurações:"
echo "   Script local: ${SCRIPT_PATH}"
echo "   Servidor: ${SSH_USER}@${SSH_HOST}:${SSH_PORT}"
echo "   Destino: ${DEST_PATH}"
echo ""

# Verificar se o script existe
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ Script não encontrado: ${SCRIPT_PATH}"
    exit 1
fi

echo "✅ Script local encontrado"
echo ""

# Tentar enviar com sshpass se disponível
if command -v sshpass > /dev/null 2>&1; then
    echo "🔑 Usando sshpass..."
    echo "   Digite a senha do servidor quando solicitado:"
    sshpass -p 'SUA_SENHA_AQUI' scp -P ${SSH_PORT} ${SCRIPT_PATH} ${SSH_USER}@${SSH_HOST}:${DEST_PATH}
else
    echo "📤 Enviando via scp (será solicitada a senha)..."
    echo ""
    scp -P ${SSH_PORT} ${SCRIPT_PATH} ${SSH_USER}@${SSH_HOST}:${DEST_PATH}
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Script enviado com sucesso!"
    echo ""
    echo "📋 Para executar no servidor, conecte via SSH e execute:"
    echo "   ssh -p ${SSH_PORT} ${SSH_USER}@${SSH_HOST}"
    echo "   chmod +x ${DEST_PATH}"
    echo "   ${DEST_PATH}"
    echo ""
else
    echo ""
    echo "❌ Erro ao enviar script"
    echo ""
    echo "💡 Alternativas:"
    echo "   1. Execute manualmente:"
    echo "      scp -P ${SSH_PORT} ${SCRIPT_PATH} ${SSH_USER}@${SSH_HOST}:${DEST_PATH}"
    echo ""
    echo "   2. Ou copie o conteúdo do script e cole no servidor"
    echo ""
fi















