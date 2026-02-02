#!/bin/bash

# Script para verificar se a assinatura digital já foi implementada

set -e

SSH_HOST="10.102.0.103"
SSH_PORT="63022"
SSH_USER="darley"
REMOTE_PATH="/var/www/lacos-backend"

echo "🔍 Verificando status da implementação de assinatura digital"
echo "============================================================"

# Ler senha do servidor
read -sp "Digite a senha do servidor: " SSH_PASS
echo ""

# Função para executar comandos no servidor
execute_remote() {
    sshpass -p "$SSH_PASS" ssh -p $SSH_PORT $SSH_USER@$SSH_HOST "$1"
}

echo ""
echo "1️⃣ Verificando OpenSSL..."
echo "------------------------------------------------------------"

execute_remote "which openssl && openssl version || echo '❌ OpenSSL não encontrado'"

echo ""
echo "2️⃣ Verificando extensão OpenSSL do PHP..."
echo "------------------------------------------------------------"

execute_remote "php -m | grep -i openssl && echo '✅ OpenSSL habilitado' || echo '❌ OpenSSL não habilitado'"

echo ""
echo "3️⃣ Verificando biblioteca FPDI..."
echo "------------------------------------------------------------"

execute_remote "cd /var/www/lacos-backend && if [ -d 'vendor/setasign/fpdi' ]; then echo '✅ FPDI instalado'; composer show setasign/fpdi 2>/dev/null | head -3 || echo '⚠️  FPDI encontrado mas sem informações'; else echo '❌ FPDI não instalado'; fi"

echo ""
echo "4️⃣ Verificando DigitalSignatureService..."
echo "------------------------------------------------------------"

execute_remote "cd /var/www/lacos-backend && if [ -f 'app/Services/DigitalSignatureService.php' ]; then echo '✅ Arquivo existe'; echo ''; echo '📋 Verificando implementação...'; if grep -q 'signPDFWithPFX' app/Services/DigitalSignatureService.php && grep -q 'openssl pkcs12' app/Services/DigitalSignatureService.php; then echo '✅ Implementação completa encontrada'; echo ''; echo '📝 Métodos encontrados:'; grep -E 'function (signPDF|signPDFWithPFX|validatePFXCertificate)' app/Services/DigitalSignatureService.php | head -5; else echo '⚠️  Arquivo existe mas implementação pode estar incompleta'; echo ''; echo '📝 Conteúdo atual (primeiras 20 linhas):'; head -20 app/Services/DigitalSignatureService.php; fi; else echo '❌ DigitalSignatureService.php não encontrado'; fi"

echo ""
echo "5️⃣ Verificando estrutura de diretórios..."
echo "------------------------------------------------------------"

execute_remote "cd /var/www/lacos-backend && echo '📁 Diretório temp/certificates:'; if [ -d 'storage/app/temp/certificates' ]; then echo '✅ Existe'; ls -la storage/app/temp/certificates 2>/dev/null | head -5 || echo '   (vazio)'; else echo '❌ Não existe'; fi"

echo ""
echo "6️⃣ Verificando logs recentes de assinatura..."
echo "------------------------------------------------------------"

execute_remote "cd /var/www/lacos-backend && if [ -f 'storage/logs/laravel.log' ]; then echo '📋 Últimas linhas relacionadas a assinatura:'; tail -50 storage/logs/laravel.log | grep -i 'assin\|sign\|certificate\|pfx' | tail -10 || echo '   (nenhum log encontrado)'; else echo '⚠️  Arquivo de log não encontrado'; fi"

echo ""
echo "============================================================"
echo "✅ Verificação concluída!"
echo ""
echo "📝 Resumo:"
echo "   - Se todos os itens estão ✅, a implementação está completa"
echo "   - Se algum item está ❌, execute: ./scripts/IMPLEMENTAR_ASSINATURA_DIGITAL_PFX.sh"
echo ""














