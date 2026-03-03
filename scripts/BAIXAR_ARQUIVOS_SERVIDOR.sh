#!/bin/bash

# Script para baixar controllers, models e migrations do servidor

SERVER="darley@192.168.0.20"
PORT="63022"
REMOTE_PATH="/var/www/lacos-backend"
LOCAL_PATH="/home/darley/lacos/backend-laravel"

echo "🔍 Localizando arquivos no servidor..."

# Listar controllers
echo "📁 Controllers encontrados:"
ssh -p $PORT $SERVER "find $REMOTE_PATH/app/Http/Controllers -name '*.php' -type f" 2>/dev/null | while read file; do
    echo "  - $file"
done

# Listar models
echo "📁 Models encontrados:"
ssh -p $PORT $SERVER "find $REMOTE_PATH/app/Models -name '*.php' -type f" 2>/dev/null | while read file; do
    echo "  - $file"
done

# Listar migrations
echo "📁 Migrations encontradas:"
ssh -p $PORT $SERVER "find $REMOTE_PATH/database/migrations -name '*.php' -type f" 2>/dev/null | while read file; do
    echo "  - $file"
done

echo ""
echo "📥 Baixando arquivos..."

# Baixar controllers
echo "📥 Baixando Controllers..."
ssh -p $PORT $SERVER "find $REMOTE_PATH/app/Http/Controllers -name '*.php' -type f" 2>/dev/null | while read remote_file; do
    # Calcular caminho relativo
    relative_path=${remote_file#$REMOTE_PATH/}
    local_file="$LOCAL_PATH/$relative_path"
    local_dir=$(dirname "$local_file")
    
    # Criar diretório se não existir
    mkdir -p "$local_dir"
    
    # Baixar arquivo
    echo "  Baixando: $relative_path"
    scp -P $PORT "$SERVER:$remote_file" "$local_file" 2>/dev/null
done

# Baixar models
echo "📥 Baixando Models..."
ssh -p $PORT $SERVER "find $REMOTE_PATH/app/Models -name '*.php' -type f" 2>/dev/null | while read remote_file; do
    # Calcular caminho relativo
    relative_path=${remote_file#$REMOTE_PATH/}
    local_file="$LOCAL_PATH/$relative_path"
    local_dir=$(dirname "$local_file")
    
    # Criar diretório se não existir
    mkdir -p "$local_dir"
    
    # Baixar arquivo
    echo "  Baixando: $relative_path"
    scp -P $PORT "$SERVER:$remote_file" "$local_file" 2>/dev/null
done

# Baixar migrations
echo "📥 Baixando Migrations..."
ssh -p $PORT $SERVER "find $REMOTE_PATH/database/migrations -name '*.php' -type f" 2>/dev/null | while read remote_file; do
    # Calcular caminho relativo
    relative_path=${remote_file#$REMOTE_PATH/}
    local_file="$LOCAL_PATH/$relative_path"
    local_dir=$(dirname "$local_file")
    
    # Criar diretório se não existir
    mkdir -p "$local_dir"
    
    # Baixar arquivo
    echo "  Baixando: $relative_path"
    scp -P $PORT "$SERVER:$remote_file" "$local_file" 2>/dev/null
done

echo ""
echo "✅ Download concluído!"












