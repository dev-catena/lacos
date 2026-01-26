#!/bin/bash

# Script para sincronizar controllers, models e migrations do servidor

SERVER="darley@10.102.0.103"
PORT="63022"
REMOTE_PATH="/var/www/lacos-backend"
LOCAL_PATH="/home/darley/lacos/backend-laravel"

# Opções SSH
SSH_OPTS="-p $PORT -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

echo "🔍 Verificando conexão com o servidor..."

# Testar conexão
if ! ssh $SSH_OPTS $SERVER "echo 'Conexão OK'" 2>/dev/null; then
    echo "❌ Erro: Não foi possível conectar ao servidor"
    echo "   Verifique se a chave SSH está configurada ou se precisa de senha"
    exit 1
fi

echo "✅ Conexão estabelecida!"
echo ""

# Listar e baixar Controllers
echo "📁 Controllers:"
ssh $SSH_OPTS $SERVER "find $REMOTE_PATH/app/Http/Controllers -name '*.php' -type f" 2>/dev/null | while read remote_file; do
    relative_path=${remote_file#$REMOTE_PATH/}
    local_file="$LOCAL_PATH/$relative_path"
    local_dir=$(dirname "$local_file")
    
    mkdir -p "$local_dir"
    
    echo "  📥 $relative_path"
    scp $SSH_OPTS "$SERVER:$remote_file" "$local_file" 2>/dev/null && echo "    ✅ Baixado" || echo "    ❌ Erro"
done

echo ""

# Listar e baixar Models
echo "📁 Models:"
ssh $SSH_OPTS $SERVER "find $REMOTE_PATH/app/Models -name '*.php' -type f" 2>/dev/null | while read remote_file; do
    relative_path=${remote_file#$REMOTE_PATH/}
    local_file="$LOCAL_PATH/$relative_path"
    local_dir=$(dirname "$local_file")
    
    mkdir -p "$local_dir"
    
    echo "  📥 $relative_path"
    scp $SSH_OPTS "$SERVER:$remote_file" "$local_file" 2>/dev/null && echo "    ✅ Baixado" || echo "    ❌ Erro"
done

echo ""

# Listar e baixar Migrations
echo "📁 Migrations:"
ssh $SSH_OPTS $SERVER "find $REMOTE_PATH/database/migrations -name '*.php' -type f" 2>/dev/null | while read remote_file; do
    relative_path=${remote_file#$REMOTE_PATH/}
    local_file="$LOCAL_PATH/$relative_path"
    local_dir=$(dirname "$local_file")
    
    mkdir -p "$local_dir"
    
    echo "  📥 $relative_path"
    scp $SSH_OPTS "$SERVER:$remote_file" "$local_file" 2>/dev/null && echo "    ✅ Baixado" || echo "    ❌ Erro"
done

echo ""
echo "✅ Sincronização concluída!"






