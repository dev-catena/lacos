#!/bin/bash

# Solução Definitiva para Problema de QR Code no Expo Go
# Este script tenta múltiplas abordagens até encontrar uma que funcione

set -e

cd /home/darley/lacos || exit 1

echo "🔧 SOLUÇÃO DEFINITIVA: Problema QR Code Expo Go"
echo "================================================"
echo ""

# 1. Parar TODOS os processos relacionados
echo "1️⃣ Parando processos antigos..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
pkill -f "node.*8081" 2>/dev/null || true
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

# 3. Liberar porta 8081
echo "3️⃣ Liberando porta 8081..."
if lsof -i :8081 > /dev/null 2>&1; then
    lsof -ti :8081 | xargs kill -9 2>/dev/null || true
    sleep 2
    echo "✅ Porta 8081 liberada"
else
    echo "✅ Porta 8081 já está livre"
fi
echo ""

# 4. Verificar IP
echo "4️⃣ Verificando IP da máquina..."
IP=$(hostname -I | awk '{print $1}')
EXPO_IP="192.168.0.20"
EXPO_PORT="8081"

echo "   IP atual: $IP"
echo "   IP configurado: $EXPO_IP"
if [ "$IP" != "$EXPO_IP" ]; then
    echo "   ⚠️  IP diferente! Usando IP atual: $IP"
    EXPO_IP="$IP"
fi
echo ""

# 5. Verificar firewall
echo "5️⃣ Verificando firewall..."
if command -v ufw > /dev/null; then
    if sudo ufw status | grep -q "Status: active"; then
        echo "   ⚠️  Firewall ativo, permitindo porta 8081..."
        sudo ufw allow 8081/tcp 2>/dev/null || true
    fi
fi
echo ""

# 6. Criar configuração Expo
echo "6️⃣ Criando configuração Expo..."
mkdir -p .expo
cat > .expo/settings.json << EOF
{
  "hostType": "lan",
  "lanType": "ip",
  "dev": true,
  "minify": false
}
EOF
echo "✅ Configuração criada"
echo ""

# 7. Configurar variáveis de ambiente
echo "7️⃣ Configurando variáveis de ambiente..."
export EXPO_NO_DOTENV=1
export EXPO_USE_METRO_WORKSPACE_ROOT=1
export REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP
export EXPO_PACKAGER_HOSTNAME=$EXPO_IP
export REACT_NATIVE_PACKAGER_PORT=$EXPO_PORT
export EXPO_PACKAGER_PORT=$EXPO_PORT
export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
export HOST=$EXPO_IP
export PORT=$EXPO_PORT
export METRO_HOST=$EXPO_IP
export PACKAGER_HOSTNAME=$EXPO_IP
echo "✅ Variáveis configuradas"
echo ""

# 8. Verificar se expo-dev-client está instalado
USE_DEV_CLIENT=""
if npm list expo-dev-client > /dev/null 2>&1; then
    echo "✅ expo-dev-client detectado"
    USE_DEV_CLIENT="--dev-client"
else
    echo "✅ Usando Expo Go"
fi
echo ""

# 9. Mostrar opções
echo "═══════════════════════════════════════════════════════════"
echo "🎯 OPÇÕES DE INICIALIZAÇÃO:"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "1️⃣  TUNNEL MODE (Recomendado - Funciona sempre)"
echo "    Comando: npx expo start --tunnel --clear"
echo "    ✅ Funciona em qualquer rede"
echo "    ✅ QR code funciona no iOS e Android"
echo "    ⚠️  Pode ser um pouco mais lento"
echo ""
echo "2️⃣  LAN MODE com IP forçado"
echo "    Comando: REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP npx expo start --lan --clear"
echo "    ✅ Mais rápido"
echo "    ⚠️  Requer mesma rede Wi-Fi"
echo ""
echo "3️⃣  LAN MODE padrão (deixa Expo detectar IP)"
echo "    Comando: npx expo start --lan --clear"
echo "    ✅ Simples"
echo "    ⚠️  Pode não detectar IP correto"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# 10. Perguntar qual opção usar
read -p "Escolha uma opção (1, 2 ou 3) [padrão: 1]: " OPCAO
OPCAO=${OPCAO:-1}

case $OPCAO in
    1)
        echo ""
        echo "🚀 Iniciando em TUNNEL MODE..."
        echo "   QR code deve funcionar em iOS e Android"
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
        echo "   QR code deve mostrar: exp://$EXPO_IP:$EXPO_PORT"
        echo ""
        if [ -n "$USE_DEV_CLIENT" ]; then
            REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP \
            EXPO_PACKAGER_HOSTNAME=$EXPO_IP \
            EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 \
            npx expo start --lan --host $EXPO_IP --port $EXPO_PORT --clear $USE_DEV_CLIENT
        else
            REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP \
            EXPO_PACKAGER_HOSTNAME=$EXPO_IP \
            EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 \
            npx expo start --lan --host $EXPO_IP --port $EXPO_PORT --clear
        fi
        ;;
    3)
        echo ""
        echo "🚀 Iniciando em LAN MODE padrão..."
        echo ""
        if [ -n "$USE_DEV_CLIENT" ]; then
            npx expo start --lan --clear $USE_DEV_CLIENT
        else
            npx expo start --lan --clear
        fi
        ;;
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac

