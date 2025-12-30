#!/bin/bash

# Script para verificar e aumentar timeouts no backend

set -e

echo "🔧 VERIFICANDO TIMEOUTS NO BACKEND"
echo "===================================="
echo ""

BACKEND_PATH="/var/www/lacos-backend"

echo "1️⃣ Verificando timeout do PHP-FPM..."
if [ -f "/etc/php/8.2/fpm/php.ini" ]; then
    echo "   Arquivo: /etc/php/8.2/fpm/php.ini"
    grep "max_execution_time\|default_socket_timeout" /etc/php/8.2/fpm/php.ini | grep -v "^;" || echo "   ⚠️  Não encontrado (usando padrão)"
fi

echo ""
echo "2️⃣ Verificando timeout do Nginx..."
if [ -f "/etc/nginx/sites-available/default" ] || [ -f "/etc/nginx/sites-available/lacos" ]; then
    NGINX_CONF=$(find /etc/nginx/sites-available -name "*lacos*" -o -name "default" | head -1)
    if [ -f "$NGINX_CONF" ]; then
        echo "   Arquivo: $NGINX_CONF"
        grep -i "timeout\|fastcgi_read_timeout\|proxy_read_timeout" "$NGINX_CONF" || echo "   ⚠️  Timeouts não configurados (usando padrão)"
    fi
fi

echo ""
echo "3️⃣ Verificando timeout do PHP-FPM pool..."
if [ -f "/etc/php/8.2/fpm/pool.d/www.conf" ]; then
    echo "   Arquivo: /etc/php/8.2/fpm/pool.d/www.conf"
    grep "request_terminate_timeout" /etc/php/8.2/fpm/pool.d/www.conf | grep -v "^;" || echo "   ⚠️  Não configurado (sem limite)"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "💡 RECOMENDAÇÕES"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Se os timeouts estiverem muito baixos, aumente:"
echo ""
echo "1. PHP max_execution_time (em /etc/php/8.2/fpm/php.ini):"
echo "   max_execution_time = 300  # 5 minutos"
echo ""
echo "2. Nginx fastcgi_read_timeout (em /etc/nginx/sites-available/...):"
echo "   fastcgi_read_timeout 300;  # 5 minutos"
echo ""
echo "3. PHP-FPM request_terminate_timeout (em /etc/php/8.2/fpm/pool.d/www.conf):"
echo "   request_terminate_timeout = 300  # 5 minutos"
echo ""
echo "Depois de alterar, reinicie:"
echo "   sudo systemctl restart php8.2-fpm"
echo "   sudo systemctl restart nginx"
echo ""






