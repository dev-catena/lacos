#!/bin/bash

# Script para copiar e executar o script de instalação no servidor

set -e

SERVER="darley@192.168.0.20"
SSH_PORT="63022"
SSH_PORT="63022"
SCRIPT_LOCAL="scripts/INSTALAR_SAVE_AVAILABILITY_SERVIDOR.sh"
SCRIPT_REMOTO="/tmp/INSTALAR_SAVE_AVAILABILITY_SERVIDOR.sh"

echo "🔧 Copiando script para o servidor..."
echo ""

# Verificar se sshpass está disponível
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass não está instalado."
    echo "💡 Instale com: sudo apt-get install sshpass"
    exit 1
fi

# Solicitar senha
read -sp "Digite a senha do servidor: " SUDO_PASS
echo ""
export SUDO_PASS

# Copiar script para o servidor
echo "📦 Copiando script (porta $SSH_PORT)..."
if sshpass -p "$SUDO_PASS" scp -P $SSH_PORT -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$SCRIPT_LOCAL" "$SERVER:$SCRIPT_REMOTO" 2>&1; then
    echo "✅ Script copiado com sucesso"
else
    echo "❌ Erro ao copiar script"
    exit 1
fi

echo ""
echo "🚀 Executando script no servidor..."
echo ""

# Executar script no servidor com sudo
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no -o ConnectTimeout=30 $SERVER "chmod +x $SCRIPT_REMOTO && sudo $SCRIPT_REMOTO"

# Limpar script remoto
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "rm -f $SCRIPT_REMOTO" 2>/dev/null || true

echo ""
echo "✅ Processo concluído!"

