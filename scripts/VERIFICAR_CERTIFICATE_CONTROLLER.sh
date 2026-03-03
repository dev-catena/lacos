#!/bin/bash

SSH_USER="darley"
SSH_HOST="192.168.0.20"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔍 Verificando CertificateController no servidor..."
echo ""

# Verificar o conteúdo do arquivo
sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $BACKEND_PATH && \
    echo '📋 Primeiras 20 linhas do CertificateController:' && \
    head -n 20 app/Http/Controllers/Api/CertificateController.php && \
    echo '' && \
    echo '📋 Verificando namespace e nome da classe:' && \
    grep -E '^namespace|^class' app/Http/Controllers/Api/CertificateController.php && \
    echo '' && \
    echo '📋 Verificando se a rota está registrada corretamente:' && \
    grep -r 'certificate/upload' routes/ || echo 'Rota não encontrada em routes/'"

echo ""
echo "✅ Verificação concluída!"
