#!/bin/bash

# Script para corrigir o endpoint /user usando sed diretamente

SSH_USER="darley"
SSH_HOST="192.168.0.20"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔧 Corrigindo endpoint /user usando sed..."

# Criar o novo conteúdo da linha
NEW_LINE="        return response()->json(\$user->makeVisible([
            'certificate_path',
            'certificate_apx_path',
            'certificate_username',
            'certificate_type',
            'has_certificate',
            'certificate_uploaded_at'
        ]));"

# Executar sed no servidor para substituir a linha
sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $BACKEND_PATH && \
    sudo sed -i.bak\$(date +%s) \"s|return response()->json(\\\$user);|return response()->json(\\\$user->makeVisible([\n            'certificate_path',\n            'certificate_apx_path',\n            'certificate_username',\n            'certificate_type',\n            'has_certificate',\n            'certificate_uploaded_at'\n        ]));|g\" routes/api.php && \
    sudo php artisan route:clear && \
    sudo php artisan config:clear && \
    sudo php artisan cache:clear && \
    echo '✅ Endpoint /user corrigido com sucesso!'"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Correção aplicada!"
    echo ""
    echo "📋 Agora teste no app:"
    echo "   1. Faça upload do certificado novamente"
    echo "   2. Saia e entre no app"
    echo "   3. Vá para: Perfil > Dados Profissionais"
    echo "   4. O card verde deve aparecer mostrando '✅ Certificado digital instalado'"
else
    echo "❌ Erro ao corrigir endpoint /user"
    exit 1
fi














