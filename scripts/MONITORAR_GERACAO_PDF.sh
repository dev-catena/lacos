#!/bin/bash

cd /var/www/lacos-backend || exit 1

echo "🔍 Monitorando logs em tempo real..."
echo "📋 Pressione Ctrl+C para parar"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Limpar logs antigos relacionados a PDF (opcional)
# tail -0 storage/logs/laravel.log > /dev/null

# Monitorar logs em tempo real
tail -f storage/logs/laravel.log | grep --line-buffered -i -E "pdf|certificate|storage|temp|file_put_contents|generateCertificatePDF" | while read line; do
    echo "[$(date '+%H:%M:%S')] $line"
done





