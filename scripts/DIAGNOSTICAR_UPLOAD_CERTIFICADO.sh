#!/bin/bash

SSH_USER="darley"
SSH_HOST="193.203.182.22"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔍 Diagnosticando problema de upload de certificado..."
echo ""

sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $BACKEND_PATH && \
    echo '1️⃣ Verificando sintaxe do CertificateController:' && \
    php -l app/Http/Controllers/Api/CertificateController.php && \
    echo '' && \
    echo '2️⃣ Atualizando autoload:' && \
    composer dump-autoload 2>&1 | tail -n 5 && \
    echo '' && \
    echo '3️⃣ Verificando logs de erro recentes (últimas 100 linhas):' && \
    tail -n 100 storage/logs/laravel.log | grep -A 10 -B 5 -i 'certificate\|upload\|error' | tail -n 30 || echo 'Nenhum erro recente encontrado' && \
    echo '' && \
    echo '4️⃣ Verificando permissões do diretório de certificados:' && \
    ls -la storage/app/certificates/ 2>/dev/null || echo 'Diretório certificates não existe' && \
    echo '' && \
    echo '5️⃣ Verificando se o campo certificate_uploaded_at está sendo atualizado:' && \
    echo '   (Precisa adicionar este campo no updateData se não estiver)'"

echo ""
echo "✅ Diagnóstico concluído!"





