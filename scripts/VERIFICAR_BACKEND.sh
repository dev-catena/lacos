#!/bin/bash

# Script para verificar conectividade com backend

set -e

echo "🔍 VERIFICANDO CONECTIVIDADE COM BACKEND"
echo "========================================="
echo ""

BACKEND_URL="http://192.168.0.20/api"

echo "📡 Backend URL: $BACKEND_URL"
echo ""

# 1. Testar conectividade básica
echo "1️⃣ Testando conectividade básica..."
if ping -c 2 -W 2 192.168.0.20 > /dev/null 2>&1; then
    echo "✅ Servidor responde ao ping"
else
    echo "❌ Servidor NÃO responde ao ping"
    echo "   Pode estar offline ou firewall bloqueando"
fi
echo ""

# 2. Testar HTTP
echo "2️⃣ Testando HTTP..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 15 "$BACKEND_URL" 2>&1 || echo "000")

if [ "$HTTP_CODE" = "000" ]; then
    echo "❌ Não foi possível conectar (timeout ou erro de rede)"
    echo ""
    echo "💡 Possíveis causas:"
    echo "   1. Backend está offline"
    echo "   2. Firewall bloqueando"
    echo "   3. Problema de rede"
    echo "   4. URL incorreta"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "⚠️  Backend responde mas retorna 404"
    echo "   Backend está online, mas endpoint pode estar errado"
elif [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    echo "✅ Backend está respondendo (código: $HTTP_CODE)"
    echo "   Backend está online e acessível!"
else
    echo "⚠️  Backend respondeu com código: $HTTP_CODE"
fi
echo ""

# 3. Testar CORS (OPTIONS request)
echo "3️⃣ Testando CORS..."
CORS_HEADERS=$(curl -s -I -X OPTIONS --connect-timeout 10 --max-time 15 \
    -H "Origin: http://localhost:8081" \
    -H "Access-Control-Request-Method: GET" \
    "$BACKEND_URL" 2>&1 | grep -i "access-control" || echo "")

if [ -n "$CORS_HEADERS" ]; then
    echo "✅ CORS está configurado"
    echo "   Headers: $CORS_HEADERS"
else
    echo "⚠️  CORS pode não estar configurado corretamente"
    echo "   Backend pode bloquear requisições do web"
fi
echo ""

# 4. Testar endpoint específico
echo "4️⃣ Testando endpoint /api (sem autenticação)..."
ENDPOINT_TEST=$(curl -s --connect-timeout 10 --max-time 15 "$BACKEND_URL" 2>&1 | head -5)

if [ -n "$ENDPOINT_TEST" ]; then
    echo "✅ Endpoint responde"
    echo "   Resposta: $(echo "$ENDPOINT_TEST" | head -1)"
else
    echo "❌ Endpoint não responde"
fi
echo ""

# 5. Resumo e recomendações
echo "═══════════════════════════════════════════════════════════"
echo "📋 RESUMO E RECOMENDAÇÕES"
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ "$HTTP_CODE" = "000" ]; then
    echo "❌ PROBLEMA: Backend não está acessível"
    echo ""
    echo "💡 SOLUÇÕES:"
    echo ""
    echo "1. Verificar se backend está rodando:"
    echo "   ssh darley@192.168.0.20"
    echo "   cd /var/www/lacos-backend"
    echo "   php artisan serve"
    echo ""
    echo "2. Verificar firewall no servidor:"
    echo "   sudo ufw status"
    echo "   sudo ufw allow 80/tcp"
    echo "   sudo ufw allow 443/tcp"
    echo ""
    echo "3. Verificar se nginx/apache está rodando:"
    echo "   sudo systemctl status nginx"
    echo "   sudo systemctl status apache2"
    echo ""
    echo "4. Usar desenvolvimento local temporariamente:"
    echo "   # Configurar backend local se possível"
    echo ""
elif [ -z "$CORS_HEADERS" ]; then
    echo "⚠️  PROBLEMA: CORS pode não estar configurado"
    echo ""
    echo "💡 SOLUÇÃO: Configurar CORS no backend"
    echo ""
    echo "Execute no servidor:"
    echo "   cd /var/www/lacos-backend"
    echo "   # Adicionar localhost:8081 e localhost:19006 aos allowed_origins"
    echo "   # em config/cors.php"
    echo ""
else
    echo "✅ Backend parece estar funcionando!"
    echo ""
    echo "💡 Se ainda tiver problemas no web:"
    echo "   1. Verificar console do navegador (F12)"
    echo "   2. Verificar Network tab para ver requisições"
    echo "   3. Verificar se há erros de CORS específicos"
    echo ""
fi

echo "═══════════════════════════════════════════════════════════"
echo ""

