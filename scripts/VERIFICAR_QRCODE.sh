#!/bin/bash

echo "🔍 Verificando configuração do QR code..."
echo ""

cd /home/darley/lacos || exit 1

# Verificar se Expo está rodando
if lsof -i :8081 > /dev/null 2>&1; then
    echo "✅ Expo está rodando na porta 8081"
    echo ""
    echo "📱 Verificando URL do Metro..."
    
    # Tentar obter a URL do Metro
    curl -s http://localhost:8081/status 2>/dev/null | head -5
    echo ""
    
    # Verificar variáveis de ambiente do processo
    PID=$(lsof -ti :8081 | head -1)
    if [ -n "$PID" ]; then
        echo "🔍 Variáveis de ambiente do processo Expo (PID: $PID):"
        cat /proc/$PID/environ 2>/dev/null | tr '\0' '\n' | grep -E "HOST|HOSTNAME|PACKAGER" | head -10
    fi
else
    echo "❌ Expo não está rodando"
    echo ""
    echo "💡 Para iniciar:"
    echo "   ./FORCAR_IP_METRO.sh"
fi

echo ""
echo "📋 Verificando configurações..."
echo ""

# Verificar metro.config.js
if grep -q "192.168.0.20" metro.config.js 2>/dev/null; then
    echo "✅ metro.config.js configurado com IP 192.168.0.20"
else
    echo "⚠️  metro.config.js não tem IP configurado"
fi

# Verificar variáveis de ambiente atuais
echo ""
echo "🔍 Variáveis de ambiente atuais:"
env | grep -E "HOST|HOSTNAME|PACKAGER|EXPO" | head -10

