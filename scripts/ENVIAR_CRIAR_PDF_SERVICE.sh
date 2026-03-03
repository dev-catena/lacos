#!/bin/bash

# Script para enviar e executar CRIAR_PDF_SERVICE.sh no servidor

set -e

echo "📤 ENVIANDO E EXECUTANDO CRIAR_PDF_SERVICE.sh"
echo "=============================================="
echo ""

SSH_HOST="192.168.0.20"
SSH_PORT="63022"
SSH_USER="darley"
SCRIPT_LOCAL="scripts/CRIAR_PDF_SERVICE.sh"
SCRIPT_REMOTE="/tmp/CRIAR_PDF_SERVICE.sh"

echo "📋 Configurações:"
echo "   Host: ${SSH_HOST}:${SSH_PORT}"
echo "   Usuário: ${SSH_USER}"
echo "   Script local: ${SCRIPT_LOCAL}"
echo "   Script remoto: ${SCRIPT_REMOTE}"
echo ""

# Verificar se o script local existe
if [ ! -f "$SCRIPT_LOCAL" ]; then
    echo "❌ Script local não encontrado: ${SCRIPT_LOCAL}"
    exit 1
fi

echo "1️⃣ Enviando script para o servidor..."
scp -P ${SSH_PORT} ${SCRIPT_LOCAL} ${SSH_USER}@${SSH_HOST}:${SCRIPT_REMOTE}

if [ $? -eq 0 ]; then
    echo "   ✅ Script enviado com sucesso"
else
    echo "   ❌ Erro ao enviar script"
    exit 1
fi

echo ""
echo "2️⃣ Executando script no servidor..."
ssh -p ${SSH_PORT} ${SSH_USER}@${SSH_HOST} << EOF
    chmod +x ${SCRIPT_REMOTE}
    ${SCRIPT_REMOTE}
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Script executado com sucesso!"
    echo ""
    echo "🔄 Teste novamente a geração do PDF no aplicativo"
else
    echo ""
    echo "❌ Erro ao executar script no servidor"
    echo "   Tente executar manualmente:"
    echo "   ssh -p ${SSH_PORT} ${SSH_USER}@${SSH_HOST}"
    echo "   chmod +x ${SCRIPT_REMOTE}"
    echo "   ${SCRIPT_REMOTE}"
    exit 1
fi















