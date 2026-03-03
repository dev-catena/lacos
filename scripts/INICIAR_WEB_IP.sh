                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            #!/bin/bash

# Script para iniciar Expo Web no IP (acessível de outros dispositivos)

set -e

cd /home/darley/lacos || exit 1

echo "🌐 INICIANDO WEB NO IP"
echo "======================"
echo ""

# IP e Porta
EXPO_IP="192.168.0.20"
EXPO_PORT="8081"

# Verificar IP atual
IP_ATUAL=$(hostname -I | awk '{print $1}')
if [ "$IP_ATUAL" != "$EXPO_IP" ]; then
    echo "⚠️  IP atual ($IP_ATUAL) diferente do esperado ($EXPO_IP)"
    read -p "Usar IP atual? (s/n) [s]: " USAR_IP_ATUAL
    USAR_IP_ATUAL=${USAR_IP_ATUAL:-s}
    if [ "$USAR_IP_ATUAL" = "s" ]; then
        EXPO_IP="$IP_ATUAL"
    fi
fi

echo "📱 Configuração:"
echo "   IP: $EXPO_IP"
echo "   Porta: $EXPO_PORT"
echo "   URL: http://${EXPO_IP}:${EXPO_PORT}"
echo ""

# Parar processos antigos
echo "1️⃣ Parando processos antigos..."
pkill -f "expo start" 2>/dev/null || true
sleep 2
echo "✅ Parado"
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "🚀 INICIANDO WEB NO IP"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 IMPORTANTE:"
echo "   ✅ Aplicação será acessível em: http://${EXPO_IP}:${EXPO_PORT}"
echo "   ✅ Outros dispositivos na mesma rede podem acessar"
echo "   ✅ Use esta URL em qualquer dispositivo/navegador"
echo ""
echo "📱 Para acessar de outro dispositivo:"
echo "   1. Certifique-se que está na mesma rede Wi-Fi"
echo "   2. Abra navegador no dispositivo"
echo "   3. Acesse: http://${EXPO_IP}:${EXPO_PORT}"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# Configurar variáveis de ambiente - CRÍTICO: HOST deve ser 0.0.0.0
export HOST="0.0.0.0"  # CRÍTICO: Escutar em todas as interfaces
export PORT="$EXPO_PORT"
export EXPO_IP="$EXPO_IP"
export EXPO_PORT="$EXPO_PORT"
export EXPO_DEVTOOLS_LISTEN_ADDRESS="0.0.0.0"
export REACT_NATIVE_PACKAGER_HOSTNAME="$EXPO_IP"
export EXPO_PACKAGER_HOSTNAME="$EXPO_IP"
export WEB_HOST="0.0.0.0"  # Para webpack/vite escutar em todas as interfaces
export WDS_SOCKET_HOST="$EXPO_IP"  # Webpack Dev Server
export WDS_SOCKET_PORT="$EXPO_PORT"
export HOSTNAME="0.0.0.0"

# Iniciar Expo Web forçando 0.0.0.0
node scripts/start-web-forcado-ip.js

