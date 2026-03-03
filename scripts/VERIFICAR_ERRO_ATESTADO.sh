#!/bin/bash

# Script para verificar o erro ao gerar atestado no backend

echo "🔍 VERIFICANDO ERRO NO LOG DO LARAVEL"
echo "======================================"
echo ""

# Verificar se está no servidor
if [ ! -d "/var/www/lacos-backend" ]; then
    echo "❌ Este script deve ser executado no servidor (192.168.0.20)"
    echo "   Execute: ssh -p 63022 root@192.168.0.20"
    exit 1
fi

cd /var/www/lacos-backend || exit 1

LOG_FILE="storage/logs/laravel.log"

if [ ! -f "$LOG_FILE" ]; then
    echo "❌ Arquivo de log não encontrado: $LOG_FILE"
    exit 1
fi

echo "📋 Últimas 200 linhas do log (procurando por erros relacionados a atestado):"
echo ""

# Procurar por erros relacionados a generate-signed-certificate
echo "1️⃣ Erros relacionados a 'generate-signed-certificate':"
echo "─────────────────────────────────────────────────────────"
grep -i "generate-signed-certificate\|generateSignedCertificate" "$LOG_FILE" | tail -20
echo ""

# Procurar por exceções recentes
echo "2️⃣ Últimas exceções no log:"
echo "─────────────────────────────────────────────────────────"
grep -A 10 "Exception\|Error\|Fatal" "$LOG_FILE" | tail -50
echo ""

# Mostrar últimas linhas do log
echo "3️⃣ Últimas 100 linhas do log:"
echo "─────────────────────────────────────────────────────────"
tail -100 "$LOG_FILE"
echo ""

# Procurar especificamente por erros de PDF ou assinatura
echo "4️⃣ Erros relacionados a PDF ou assinatura digital:"
echo "─────────────────────────────────────────────────────────"
grep -i "pdf\|signature\|certificate\|dompdf\|signPDF" "$LOG_FILE" | tail -20
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "💡 DICAS:"
echo "   • Se o erro mencionar 'Class not found', pode faltar uma dependência"
echo "   • Se o erro mencionar 'Permission denied', verifique permissões dos diretórios"
echo "   • Se o erro mencionar 'PDF', pode ser problema com dompdf ou template"
echo "   • Se o erro mencionar 'certificate', pode ser problema com certificado digital"
echo "═══════════════════════════════════════════════════════════"
