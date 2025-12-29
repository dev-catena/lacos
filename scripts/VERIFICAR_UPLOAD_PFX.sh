#!/bin/bash

# Script para verificar se o arquivo .pfx foi salvo no servidor

SSH_USER="darley"
SSH_HOST="193.203.182.22"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"
USER_ID="${1:-50}"  # ID do usuário (padrão: 50 - Carlos Abacaxi)

echo "🔍 Verificando upload do arquivo .pfx do usuário ID $USER_ID no servidor..."
echo ""

# 1. Verificar no banco de dados
echo "📊 1. Verificando no banco de dados:"
sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $BACKEND_PATH && echo 'yhvh77' | sudo -S php artisan tinker --execute=\"
\\\$user = App\\\\Models\\\\User::find($USER_ID);
if (\\\$user) {
    echo 'ID: ' . \\\$user->id . PHP_EOL;
    echo 'Nome: ' . \\\$user->name . PHP_EOL;
    echo 'certificate_path: ' . (\\\$user->certificate_path ?? 'null') . PHP_EOL;
    echo 'certificate_type: ' . (\\\$user->certificate_type ?? 'null') . PHP_EOL;
    echo 'has_certificate: ' . (\\\$user->has_certificate ? 'true' : 'false') . PHP_EOL;
} else {
    echo 'Usuário não encontrado!' . PHP_EOL;
}
\"" 2>&1 | grep -v "PHP Warning" | grep -v "password"

echo ""
echo ""

# 2. Verificar arquivo no disco
echo "📁 2. Verificando arquivo no disco:"
CERT_PATH=$(sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $BACKEND_PATH && echo 'yhvh77' | sudo -S php artisan tinker --execute=\"
\\\$user = App\\\\Models\\\\User::find($USER_ID);
if (\\\$user && \\\$user->certificate_path) {
    echo \\\$user->certificate_path;
} else {
    echo 'null';
}
\"" 2>&1 | grep -v "PHP Warning" | grep -v "password" | tail -1)

if [ "$CERT_PATH" != "null" ] && [ -n "$CERT_PATH" ]; then
    echo "   Caminho do certificado no banco: $CERT_PATH"
    
    # Construir caminho completo
    FULL_PATH="$BACKEND_PATH/storage/app/$CERT_PATH"
    echo "   Caminho completo no servidor: $FULL_PATH"
    
    # Verificar se o arquivo existe
    FILE_EXISTS=$(sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "if [ -f '$FULL_PATH' ]; then echo 'SIM'; else echo 'NÃO'; fi")
    echo "   Arquivo existe no disco: $FILE_EXISTS"
    
    if [ "$FILE_EXISTS" = "SIM" ]; then
        FILE_SIZE=$(sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "ls -lh '$FULL_PATH' | awk '{print \$5}'")
        FILE_DATE=$(sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "ls -l '$FULL_PATH' | awk '{print \$6, \$7, \$8}'")
        FILE_PERMISSIONS=$(sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "ls -l '$FULL_PATH' | awk '{print \$1}'")
        echo "   Tamanho: $FILE_SIZE"
        echo "   Data de modificação: $FILE_DATE"
        echo "   Permissões: $FILE_PERMISSIONS"
        
        # Verificar tipo do arquivo
        FILE_TYPE=$(sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "file '$FULL_PATH'")
        echo "   Tipo do arquivo: $FILE_TYPE"
    fi
else
    echo "   ❌ Nenhum caminho de certificado encontrado no banco de dados"
fi

echo ""
echo ""

# 3. Verificar diretório de certificados
echo "📂 3. Verificando diretório de certificados:"
CERT_DIR="$BACKEND_PATH/storage/app/certificates/doctors/$USER_ID"
DIR_EXISTS=$(sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "if [ -d '$CERT_DIR' ]; then echo 'SIM'; else echo 'NÃO'; fi")
echo "   Diretório existe: $DIR_EXISTS"

if [ "$DIR_EXISTS" = "SIM" ]; then
    FILES=$(sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "ls -lh '$CERT_DIR' 2>/dev/null | tail -n +2")
    if [ -n "$FILES" ]; then
        echo "   Arquivos no diretório:"
        echo "$FILES" | while read line; do
            echo "      $line"
        done
    else
        echo "   Diretório vazio"
    fi
fi

echo ""
echo ""

# 4. Verificar logs recentes de upload
echo "📋 4. Verificando logs recentes de upload (últimas 20 linhas):"
sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $BACKEND_PATH && tail -20 storage/logs/laravel.log | grep -i 'certificate\|pfx\|upload' || echo 'Nenhum log relacionado encontrado'" 2>&1 | grep -v "PHP Warning"

echo ""
echo "✅ Verificação concluída!"


