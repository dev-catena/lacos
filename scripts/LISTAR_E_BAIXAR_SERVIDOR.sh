#!/bin/bash

# Script para listar e baixar arquivos do servidor
# Se a autenticação SSH automática não funcionar, este script gera comandos manuais

SERVER="darley@10.102.0.103"
PORT="63022"
REMOTE_PATH="/var/www/lacos-backend"
LOCAL_PATH="/home/darley/lacos/backend-laravel"

echo "📋 Gerando lista de arquivos e comandos para download..."
echo ""

# Criar arquivo com lista de comandos
COMMANDS_FILE="/tmp/comandos_download_$$.sh"
echo "#!/bin/bash" > "$COMMANDS_FILE"
echo "# Comandos gerados para download de arquivos do servidor" >> "$COMMANDS_FILE"
echo "" >> "$COMMANDS_FILE"

echo "# Criar diretórios locais" >> "$COMMANDS_FILE"
echo "mkdir -p $LOCAL_PATH/app/Http/Controllers" >> "$COMMANDS_FILE"
echo "mkdir -p $LOCAL_PATH/app/Models" >> "$COMMANDS_FILE"
echo "mkdir -p $LOCAL_PATH/database/migrations" >> "$COMMANDS_FILE"
echo "" >> "$COMMANDS_FILE"

# Tentar listar arquivos via SSH (pode precisar de autenticação manual)
echo "🔍 Tentando listar arquivos do servidor..."
echo ""

# Listar controllers
echo "📁 Controllers:"
ssh -p $PORT $SERVER "find $REMOTE_PATH/app/Http/Controllers -name '*.php' -type f 2>/dev/null" 2>&1 | while read file; do
    if [[ $file == *".php"* ]]; then
        relative_path=${file#$REMOTE_PATH/}
        local_file="$LOCAL_PATH/$relative_path"
        local_dir=$(dirname "$local_file")
        
        echo "  📄 $relative_path"
        echo "mkdir -p \"$local_dir\"" >> "$COMMANDS_FILE"
        echo "scp -P $PORT \"$SERVER:$file\" \"$local_file\"" >> "$COMMANDS_FILE"
    fi
done

echo ""

# Listar models
echo "📁 Models:"
ssh -p $PORT $SERVER "find $REMOTE_PATH/app/Models -name '*.php' -type f 2>/dev/null" 2>&1 | while read file; do
    if [[ $file == *".php"* ]]; then
        relative_path=${file#$REMOTE_PATH/}
        local_file="$LOCAL_PATH/$relative_path"
        local_dir=$(dirname "$local_file")
        
        echo "  📄 $relative_path"
        echo "mkdir -p \"$local_dir\"" >> "$COMMANDS_FILE"
        echo "scp -P $PORT \"$SERVER:$file\" \"$local_file\"" >> "$COMMANDS_FILE"
    fi
done

echo ""

# Listar migrations
echo "📁 Migrations:"
ssh -p $PORT $SERVER "find $REMOTE_PATH/database/migrations -name '*.php' -type f 2>/dev/null" 2>&1 | while read file; do
    if [[ $file == *".php"* ]]; then
        relative_path=${file#$REMOTE_PATH/}
        local_file="$LOCAL_PATH/$relative_path"
        local_dir=$(dirname "$local_file")
        
        echo "  📄 $relative_path"
        echo "mkdir -p \"$local_dir\"" >> "$COMMANDS_FILE"
        echo "scp -P $PORT \"$SERVER:$file\" \"$local_file\"" >> "$COMMANDS_FILE"
    fi
done

chmod +x "$COMMANDS_FILE"

echo ""
echo "✅ Arquivo de comandos gerado: $COMMANDS_FILE"
echo ""
echo "Para executar os downloads, você pode:"
echo "  1. Executar: bash $COMMANDS_FILE"
echo "  2. Ou fazer o download manualmente usando os comandos listados acima"
echo ""





