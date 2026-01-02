#!/bin/bash

SSH_USER="darley"
SSH_HOST="193.203.182.22"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔧 Corrigindo endpoint /user usando sed..."

# Criar arquivo temporário com a nova linha
NEW_RETURN="        return response()->json(\$user->makeVisible([
            'certificate_path',
            'certificate_apx_path',
            'certificate_username',
            'certificate_type',
            'has_certificate',
            'certificate_uploaded_at'
        ]));"

# Executar sed no servidor
sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $BACKEND_PATH && \
    sed -i.bak\$(date +%s) 's|return response()->json(\\\$user);|return response()->json(\\\$user->makeVisible([\n            '\''certificate_path'\'',\n            '\''certificate_apx_path'\'',\n            '\''certificate_username'\'',\n            '\''certificate_type'\'',\n            '\''has_certificate'\'',\n            '\''certificate_uploaded_at'\''\n        ]));|g' routes/api.php && \
    php artisan route:clear && \
    php artisan config:clear && \
    php artisan cache:clear && \
    echo '✅ Endpoint /user corrigido!'"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Correção aplicada!"
    echo ""
    echo "📋 Agora teste no app:"
    echo "   1. Clique no botão '🔄 FORÇAR VERIFICAÇÃO NO SERVIDOR'"
    echo "   2. Os campos do certificado devem aparecer no card amarelo"
    echo "   3. O card verde deve aparecer se houver certificado instalado"
else
    echo "❌ Erro ao corrigir endpoint /user"
    exit 1
fi









