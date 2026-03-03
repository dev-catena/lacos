#!/bin/bash

# Script para corrigir problema de QR code gerando localhost:8082

set -e

cd /home/darley/lacos || exit 1

echo "🔧 Corrigindo QR Code que gera localhost:8082"
echo "=============================================="
echo ""

# 1. Parar TODOS os processos
echo "1️⃣ Parando processos antigos..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
pkill -f "node.*8081\|node.*8082" 2>/dev/null || true
sleep 3
echo "✅ Processos parados"
echo ""

# 2. Limpar TUDO
echo "2️⃣ Limpando cache completamente..."
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .metro 2>/dev/null || true
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/haste-* 2>/dev/null || true
echo "✅ Cache limpo"
echo ""

# 3. Liberar portas
echo "3️⃣ Liberando portas 8081 e 8082..."
for PORT in 8081 8082; do
    if lsof -i :$PORT > /dev/null 2>&1; then
        lsof -ti :$PORT | xargs kill -9 2>/dev/null || true
        echo "   ✅ Porta $PORT liberada"
    fi
done
sleep 2
echo ""

# 4. Verificar IP
echo "4️⃣ Verificando IP..."
IP=$(hostname -I | awk '{print $1}')
EXPO_IP="192.168.0.20"
EXPO_PORT="8081"

if [ "$IP" != "$EXPO_IP" ]; then
    echo "   ⚠️  IP atual ($IP) diferente do esperado ($EXPO_IP)"
    read -p "   Usar IP atual? (s/n) [s]: " USAR_IP_ATUAL
    USAR_IP_ATUAL=${USAR_IP_ATUAL:-s}
    if [ "$USAR_IP_ATUAL" = "s" ]; then
        EXPO_IP="$IP"
    fi
fi

echo "   ✅ Usando IP: $EXPO_IP"
echo "   ✅ Usando Porta: $EXPO_PORT"
echo ""

# 5. Criar/Atualizar .expo/settings.json
echo "5️⃣ Configurando .expo/settings.json..."
mkdir -p .expo
cat > .expo/settings.json << EOF
{
  "hostType": "lan",
  "lanType": "ip",
  "dev": true,
  "minify": false,
  "urlRandomness": "fixed"
}
EOF
echo "✅ Configuração criada"
echo ""

# 6. Configurar TODAS as variáveis de ambiente
echo "6️⃣ Configurando variáveis de ambiente..."
export EXPO_NO_DOTENV=1
export EXPO_USE_METRO_WORKSPACE_ROOT=1
export REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP
export EXPO_PACKAGER_HOSTNAME=$EXPO_IP
export REACT_NATIVE_PACKAGER_PORT=$EXPO_PORT
export EXPO_PACKAGER_PORT=$EXPO_PORT
export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
export EXPO_DEVTOOLS_LISTEN_PORT=$EXPO_PORT
export HOST=$EXPO_IP
export PORT=$EXPO_PORT
export METRO_HOST=$EXPO_IP
export PACKAGER_HOSTNAME=$EXPO_IP
# IMPORTANTE: Forçar que não use localhost
export EXPO_NO_LOCALHOST=1
export EXPO_USE_LOCALHOST=0
echo "✅ Variáveis configuradas"
echo ""

# 7. Verificar se expo-dev-client está instalado
USE_DEV_CLIENT=""
if npm list expo-dev-client > /dev/null 2>&1; then
    USE_DEV_CLIENT="--dev-client"
    echo "✅ expo-dev-client detectado"
else
    echo "✅ Usando Expo Go"
fi
echo ""

# 8. Mostrar informações importantes
echo "═══════════════════════════════════════════════════════════"
echo "📱 CONFIGURAÇÃO:"
echo "═══════════════════════════════════════════════════════════"
echo "   IP: $EXPO_IP"
echo "   Porta: $EXPO_PORT"
echo "   URL esperada: exp://$EXPO_IP:$EXPO_PORT"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - O QR code deve mostrar: exp://$EXPO_IP:$EXPO_PORT"
echo "   - NÃO deve mostrar: http://localhost:8082"
echo "   - Se mostrar localhost, o problema persiste"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# 9. Perguntar qual modo usar
echo "Escolha o modo de inicialização:"
echo "1️⃣  TUNNEL MODE (Recomendado - sempre funciona)"
echo "2️⃣  LAN MODE com IP forçado"
echo ""
read -p "Escolha (1 ou 2) [padrão: 1]: " OPCAO
OPCAO=${OPCAO:-1}

case $OPCAO in
    1)
        echo ""
        echo "🚀 Iniciando em TUNNEL MODE..."
        echo "   QR code deve funcionar corretamente"
        echo ""
        if [ -n "$USE_DEV_CLIENT" ]; then
            npx expo start --tunnel --clear $USE_DEV_CLIENT
        else
            npx expo start --tunnel --clear
        fi
        ;;
    2)
        echo ""
        echo "🚀 Iniciando em LAN MODE com IP forçado..."
        echo "   IP: $EXPO_IP"
        echo "   Porta: $EXPO_PORT"
        echo ""
        echo "   ⚠️  Se o QR code ainda mostrar localhost:8082,"
        echo "   use TUNNEL MODE (opção 1)"
        echo ""
        if [ -n "$USE_DEV_CLIENT" ]; then
            REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP \
            EXPO_PACKAGER_HOSTNAME=$EXPO_IP \
            EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 \
            EXPO_NO_LOCALHOST=1 \
            EXPO_USE_LOCALHOST=0 \
            npx expo start --lan --host $EXPO_IP --port $EXPO_PORT --clear $USE_DEV_CLIENT
        else
            REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP \
            EXPO_PACKAGER_HOSTNAME=$EXPO_IP \
            EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 \
            EXPO_NO_LOCALHOST=1 \
            EXPO_USE_LOCALHOST=0 \
            npx expo start --lan --host $EXPO_IP --port $EXPO_PORT --clear
        fi
        ;;
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac

