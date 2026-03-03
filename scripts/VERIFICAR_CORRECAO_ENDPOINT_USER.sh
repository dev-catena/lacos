#!/bin/bash

# Script para verificar se a correção do endpoint /user foi aplicada

SSH_USER="darley"
SSH_HOST="192.168.0.20"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔍 Verificando se a correção do endpoint /user foi aplicada..."

# Verificar se sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass não está instalado. Instalando..."
    sudo apt-get update && sudo apt-get install -y sshpass
fi

# Verificar se o arquivo routes/api.php contém makeVisible
sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $BACKEND_PATH && grep -A 10 \"Route::get('/user'\" routes/api.php | grep -q 'makeVisible' && echo '✅ Correção aplicada: makeVisible encontrado' || echo '❌ Correção NÃO aplicada: makeVisible não encontrado'"

echo ""
echo "📋 Para testar no app:"
echo "   1. Faça upload do certificado novamente"
echo "   2. Saia e entre no app"
echo "   3. Vá para: Perfil > Dados Profissionais"
echo "   4. O card verde deve aparecer mostrando '✅ Certificado digital instalado'"














