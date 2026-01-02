#!/bin/bash

# Script para diagnosticar problemas do admin web

echo "🔍 DIAGNÓSTICO DO ADMIN WEB"
echo "============================"
echo ""

# 1. Verificar se o gateway HTTPS está acessível
echo "1️⃣ Testando gateway HTTPS..."
GATEWAY_STATUS=$(curl -k -s https://gateway.lacosapp.com/api/gateway/status)
if [ $? -eq 0 ]; then
    echo "   ✅ Gateway HTTPS acessível: $GATEWAY_STATUS"
else
    echo "   ❌ Gateway HTTPS não acessível"
fi
echo ""

# 2. Verificar CORS para admin.lacosapp.com
echo "2️⃣ Testando CORS para admin.lacosapp.com..."
CORS_TEST=$(curl -k -s -X OPTIONS https://gateway.lacosapp.com/api/admin/login \
    -H "Origin: https://admin.lacosapp.com" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: content-type" \
    -w "\nHTTP_CODE:%{http_code}" 2>&1)

HTTP_CODE=$(echo "$CORS_TEST" | grep "HTTP_CODE:" | cut -d: -f2)
if [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ CORS funcionando (HTTP $HTTP_CODE)"
    echo "$CORS_TEST" | grep -i "access-control" | head -5
else
    echo "   ❌ CORS com problema (HTTP $HTTP_CODE)"
fi
echo ""

# 3. Testar login direto
echo "3️⃣ Testando login direto..."
LOGIN_RESULT=$(curl -k -s -X POST https://gateway.lacosapp.com/api/admin/login \
    -H "Content-Type: application/json" \
    -H "Origin: https://admin.lacosapp.com" \
    -d '{"email":"root@lacos.com","password":"yhvh77"}' 2>&1)

if echo "$LOGIN_RESULT" | grep -q "token"; then
    echo "   ✅ Login funcionando"
    echo "   Token gerado: $(echo "$LOGIN_RESULT" | grep -o '"token":"[^"]*"' | head -1)"
else
    echo "   ❌ Login com problema"
    echo "   Resposta: $LOGIN_RESULT"
fi
echo ""

# 4. Verificar certificado SSL
echo "4️⃣ Verificando certificado SSL do gateway..."
CERT_INFO=$(echo | openssl s_client -connect gateway.lacosapp.com:443 -servername gateway.lacosapp.com 2>&1 | grep -E "Verify return code|subject=")
if echo "$CERT_INFO" | grep -q "Verify return code: 0"; then
    echo "   ✅ Certificado válido"
    echo "$CERT_INFO | grep "subject="
else
    echo "   ⚠️  Certificado com problema"
    echo "$CERT_INFO"
fi
echo ""

# 5. Verificar se o admin web está servindo arquivos corretos
echo "5️⃣ Verificando arquivos do admin web..."
ADMIN_HTML=$(curl -k -s https://admin.lacosapp.com/ | head -20)
if echo "$ADMIN_HTML" | grep -q "index.html\|react\|vite"; then
    echo "   ✅ Admin web servindo arquivos"
    if echo "$ADMIN_HTML" | grep -q "gateway.lacosapp.com"; then
        echo "   ✅ Configuração de API encontrada no HTML"
    else
        echo "   ⚠️  Configuração de API não encontrada no HTML (pode estar no JS)"
    fi
else
    echo "   ❌ Admin web não está servindo arquivos corretos"
fi
echo ""

echo "📋 RESUMO:"
echo "   - Gateway HTTPS: $(curl -k -s https://gateway.lacosapp.com/api/gateway/status > /dev/null 2>&1 && echo '✅ OK' || echo '❌ ERRO')"
echo "   - CORS: $(curl -k -s -X OPTIONS https://gateway.lacosapp.com/api/admin/login -H "Origin: https://admin.lacosapp.com" -H "Access-Control-Request-Method: POST" -w "%{http_code}" -o /dev/null 2>&1 | grep -q "204\|200" && echo '✅ OK' || echo '❌ ERRO')"
echo "   - Login: $(curl -k -s -X POST https://gateway.lacosapp.com/api/admin/login -H "Content-Type: application/json" -d '{"email":"root@lacos.com","password":"yhvh77"}' | grep -q "token" && echo '✅ OK' || echo '❌ ERRO')"
echo "   - Certificado SSL: $(echo | openssl s_client -connect gateway.lacosapp.com:443 -servername gateway.lacosapp.com 2>&1 | grep -q "Verify return code: 0" && echo '✅ OK' || echo '❌ ERRO')"
echo ""
echo "💡 Se tudo estiver OK mas ainda houver erro no navegador:"
echo "   1. Abra o console do navegador (F12)"
echo "   2. Verifique os erros na aba Console"
echo "   3. Verifique a aba Network para ver a requisição que falhou"
echo "   4. Verifique se há bloqueio de extensões do navegador"


