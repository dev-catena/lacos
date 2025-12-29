#!/bin/bash

# Script auxiliar para enviar INSTALAR_DOCKER_E_EVOLUTION_API.sh para o servidor
# Uso: ./ENVIAR_SCRIPT_DOCKER_EVOLUTION.sh [usuario@servidor]

SCRIPT_FILE="INSTALAR_DOCKER_E_EVOLUTION_API.sh"
REMOTE_PATH="/tmp/INSTALAR_DOCKER_E_EVOLUTION_API.sh"

# Verificar se o arquivo existe
if [ ! -f "$SCRIPT_FILE" ]; then
    echo "❌ Arquivo $SCRIPT_FILE não encontrado!"
    exit 1
fi

# Verificar se foi passado o servidor como argumento
if [ -z "$1" ]; then
    echo "📋 Uso: $0 usuario@servidor"
    echo ""
    echo "Exemplo:"
    echo "  $0 root@193.203.182.22"
    echo ""
    exit 1
fi

SERVER="$1"

echo "📤 Enviando $SCRIPT_FILE para $SERVER:$REMOTE_PATH..."
echo ""

# Enviar arquivo via SCP
scp "$SCRIPT_FILE" "$SERVER:$REMOTE_PATH"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Arquivo enviado com sucesso!"
    echo ""
    echo "📋 Para executar no servidor:"
    echo "   ssh $SERVER"
    echo "   sudo bash $REMOTE_PATH"
    echo ""
    echo "Ou execute diretamente:"
    echo "   ssh $SERVER 'sudo bash $REMOTE_PATH'"
else
    echo ""
    echo "❌ Erro ao enviar arquivo!"
    exit 1
fi


