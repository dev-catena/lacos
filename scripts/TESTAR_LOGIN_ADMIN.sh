#!/bin/bash

# Script para testar o login admin após correção CSRF

set -e

cd /var/www/lacos-backend

echo "🧪 Testando login admin..."

# Testar com curl
echo ""
echo "📡 Testando endpoint /api/admin/login..."
RESPONSE=$(curl -s -X POST http://localhost/api/admin/login \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{"email":"root@lacos.com","password":"yhvh77"}')

echo "📄 Resposta:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

# Verificar se retornou token
if echo "$RESPONSE" | grep -q "token"; then
    echo ""
    echo "✅ Login funcionando! Token recebido."
else
    echo ""
    echo "❌ Login falhou ou não retornou token"
    echo "📋 Verificando erro..."
    echo "$RESPONSE"
fi

echo ""
echo "🔄 Reiniciando PHP-FPM para garantir que mudanças foram aplicadas..."

# Detectar versão do PHP
PHP_VERSION=$(php -v | head -1 | grep -oP '\d+\.\d+' | head -1)
echo "📌 Versão PHP detectada: $PHP_VERSION"

# Tentar reiniciar PHP-FPM
if systemctl list-units --type=service | grep -q "php.*fpm"; then
    PHP_SERVICE=$(systemctl list-units --type=service | grep "php.*fpm" | awk '{print $1}' | head -1)
    echo "🔄 Reiniciando $PHP_SERVICE..."
    systemctl restart "$PHP_SERVICE" 2>/dev/null && echo "✅ $PHP_SERVICE reiniciado" || echo "⚠️  Não foi possível reiniciar $PHP_SERVICE"
else
    echo "⚠️  PHP-FPM não encontrado como serviço systemd"
    echo "   Tente: sudo service php$PHP_VERSION-fpm restart"
fi

echo ""
echo "✅ Teste concluído!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Teste o login na interface web"
echo "   2. Se ainda houver erro, verifique os logs:"
echo "      tail -f storage/logs/laravel.log"

