#!/bin/bash

# Script para configurar CORS no backend via SSH (porta 63022)

set -e

echo "🔧 CONFIGURANDO CORS NO BACKEND"
echo "================================"
echo ""

SERVER_USER="darley"
SERVER_HOST="10.102.0.103"
SERVER_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

echo "📡 Servidor: $SERVER_USER@$SERVER_HOST:$SERVER_PORT"
echo "📂 Backend: $BACKEND_PATH"
echo ""

# Verificar sshpass
if ! command -v sshpass &> /dev/null; then
    echo "⚠️  sshpass não está instalado"
    echo "   Instalando..."
    sudo apt-get update && sudo apt-get install -y sshpass 2>/dev/null || {
        echo "❌ Não foi possível instalar sshpass"
        exit 1
    }
fi

# Pedir senha
read -sp "🔐 Senha SSH: " SERVER_PASS
echo ""
echo ""

# Criar script temporário para executar no servidor
cat > /tmp/configurar_cors_remoto.sh << 'EOFSCRIPT'
#!/bin/bash
cd /var/www/lacos-backend || exit 1

echo "🔧 Configurando CORS..."

# Criar/atualizar config/cors.php
mkdir -p config

cat > config/cors.php << 'EOFCORS'
<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'admin/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:8081',
        'http://localhost:19006',
        'http://127.0.0.1:8081',
        'http://127.0.0.1:19006',
        'http://10.102.0.103:8081',
        'http://10.102.0.103:19006',
        'http://10.102.0.103',
        'https://10.102.0.103',
    ],
    'allowed_origins_patterns' => [
        '#^http://localhost(:\d+)?$#',
        '#^http://127\.0\.0\.1(:\d+)?$#',
        '#^http://10\.\d+\.\d+\.\d+(:\d+)?$#',
        '#^http://192\.168\.\d+\.\d+(:\d+)?$#',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
EOFCORS

chown www-data:www-data config/cors.php 2>/dev/null || chmod 644 config/cors.php

echo "✅ CORS configurado"
echo ""
echo "📋 Origens permitidas:"
echo "   - http://localhost:8081 (Expo Web)"
echo "   - http://localhost:19006 (Expo Web alternativo)"
echo "   - http://127.0.0.1:8081"
echo "   - http://10.102.0.103:8081 (seu IP local)"
echo "   - Padrões para IPs locais"
echo ""

# Limpar cache
php artisan config:clear 2>/dev/null || true
echo "✅ Cache limpo"
EOFSCRIPT

chmod +x /tmp/configurar_cors_remoto.sh

# Enviar e executar no servidor
echo "📤 Enviando script para o servidor..."
sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no -P "$SERVER_PORT" \
    /tmp/configurar_cors_remoto.sh \
    "${SERVER_USER}@${SERVER_HOST}:/tmp/" 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Erro ao enviar script"
    exit 1
fi

echo "✅ Script enviado"
echo ""

echo "▶️  Executando no servidor..."
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -p "$SERVER_PORT" \
    "${SERVER_USER}@${SERVER_HOST}" \
    "bash /tmp/configurar_cors_remoto.sh" 2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ CORS configurado com sucesso!"
    echo ""
    echo "📋 PRÓXIMOS PASSOS:"
    echo ""
    echo "1. Teste novamente o desenvolvimento web:"
    echo "   npm run web"
    echo ""
    echo "2. Se ainda tiver problemas, verifique:"
    echo "   - Se backend está acessível: ./VERIFICAR_BACKEND_SSH.sh"
    echo "   - Se firewall permite porta 80"
    echo "   - Se nginx/apache está rodando"
    echo ""
else
    echo ""
    echo "❌ Erro ao configurar CORS (código: $EXIT_CODE)"
    echo ""
    echo "💡 Tente executar manualmente no servidor:"
    echo "   ssh -p 63022 $SERVER_USER@$SERVER_HOST"
    echo "   cd $BACKEND_PATH"
    echo "   # Editar config/cors.php manualmente"
    echo ""
fi

# Limpar
rm -f /tmp/configurar_cors_remoto.sh

