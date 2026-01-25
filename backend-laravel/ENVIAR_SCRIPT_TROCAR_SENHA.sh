#!/bin/bash

# Script auxiliar para enviar ADICIONAR_TROCAR_SENHA.sh para o servidor
# Uso: ./ENVIAR_SCRIPT_TROCAR_SENHA.sh [usuario@servidor]

SCRIPT_FILE="ADICIONAR_TROCAR_SENHA.sh"
REMOTE_PATH="/tmp/ADICIONAR_TROCAR_SENHA.sh"

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
    echo "  $0 root@10.102.0.103"
    echo "  $0 usuario@servidor.com"
    echo ""
    echo "Ou configure as variáveis abaixo no script:"
    echo "  SERVER_USER=root"
    echo "  SERVER_HOST=10.102.0.103"
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
    echo "📋 Para executar no servidor, conecte-se e execute:"
    echo "   ssh $SERVER"
    echo "   chmod +x $REMOTE_PATH"
    echo "   sudo bash $REMOTE_PATH"
    echo ""
    echo "Ou execute diretamente:"
    echo "   ssh $SERVER 'chmod +x $REMOTE_PATH && sudo bash $REMOTE_PATH'"
else
    echo ""
    echo "❌ Erro ao enviar arquivo!"
    echo "   Verifique:"
    echo "   - Conexão com o servidor"
    echo "   - Permissões de acesso SSH"
    echo "   - Caminho do arquivo"
    exit 1
fi


