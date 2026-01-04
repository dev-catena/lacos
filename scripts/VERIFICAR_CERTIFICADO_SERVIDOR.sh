#!/bin/bash

# Script para verificar se o certificado foi salvo no servidor (arquivo e banco)

SSH_USER="darley"
SSH_HOST="193.203.182.22"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"
USER_ID="${1:-50}"  # ID do usuário (padrão: 50 - Carlos Abacaxi)

echo "🔍 Verificando certificado do usuário ID $USER_ID no servidor..."
echo ""

# 1. Verificar no banco de dados
echo "📊 1. Verificando no banco de dados:"
sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $BACKEND_PATH && echo 'yhvh77' | sudo -S php artisan tinker --execute=\"
\\\$user = App\\\\Models\\\\User::find($USER_ID);
if (\\\$user) {
    echo 'ID: ' . \\\$user->id . PHP_EOL;
    echo 'Nome: ' . \\\$user->name . PHP_EOL;
    echo 'has_certificate: ' . (\\\$user->has_certificate ? 'true' : 'false') . PHP_EOL;
    echo 'certificate_type: ' . (\\\$user->certificate_type ?? 'null') . PHP_EOL;
    echo 'certificate_path: ' . (\\\$user->certificate_path ?? 'null') . PHP_EOL;
    echo 'certificate_apx_path: ' . (\\\$user->certificate_apx_path ?? 'null') . PHP_EOL;
    echo 'certificate_username: ' . (\\\$user->certificate_username ?? 'null') . PHP_EOL;
    echo 'certificate_uploaded_at: ' . (\\\$user->certificate_uploaded_at ?? 'null') . PHP_EOL;
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
} elseif (\\\$user && \\\$user->certificate_apx_path) {
    echo \\\$user->certificate_apx_path;
} else {
    echo 'null';
}
\"" 2>&1 | grep -v "PHP Warning" | grep -v "password" | tail -1)

if [ "$CERT_PATH" != "null" ] && [ -n "$CERT_PATH" ]; then
    echo "   Caminho do certificado: $CERT_PATH"
    FULL_PATH=$(sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $BACKEND_PATH && echo 'yhvh77' | sudo -S php artisan tinker --execute=\"
    echo storage_path('app/' . '$CERT_PATH');
    \"" 2>&1 | grep -v "PHP Warning" | grep -v "password" | tail -1 | tr -d '\"')
    
    echo "   Caminho completo: $FULL_PATH"
    
    # Verificar se o arquivo existe
    FILE_EXISTS=$(sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "if [ -f '$FULL_PATH' ]; then echo 'SIM'; else echo 'NÃO'; fi")
    echo "   Arquivo existe: $FILE_EXISTS"
    
    if [ "$FILE_EXISTS" = "SIM" ]; then
        FILE_SIZE=$(sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "ls -lh '$FULL_PATH' | awk '{print \$5}'")
        FILE_DATE=$(sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "ls -l '$FULL_PATH' | awk '{print \$6, \$7, \$8}'")
        echo "   Tamanho: $FILE_SIZE"
        echo "   Data de modificação: $FILE_DATE"
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
echo "✅ Verificação concluída!"











