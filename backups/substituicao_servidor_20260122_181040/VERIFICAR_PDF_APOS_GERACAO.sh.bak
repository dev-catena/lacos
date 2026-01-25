#!/bin/bash

cd /var/www/lacos-backend || exit 1

echo "🔍 Verificando PDFs gerados recentemente..."
echo ""

# Verificar arquivos no diretório temp
echo "📁 Arquivos em storage/app/temp:"
ls -lah storage/app/temp/ 2>/dev/null | tail -10
echo ""

# Verificar logs mais recentes
echo "📋 Últimas 100 linhas do log (filtrando PDF):"
tail -100 storage/logs/laravel.log | grep -i -E "pdf|certificate|generateCertificatePDF|file_put_contents|PDF criado|PDF output" | tail -30

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar se há erros recentes
echo "❌ Erros recentes:"
tail -200 storage/logs/laravel.log | grep -i "error\|exception" | grep -i -E "pdf|certificate|storage|temp" | tail -10





