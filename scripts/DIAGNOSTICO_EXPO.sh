#!/bin/bash

# Script de diagnóstico completo para problemas de QR code no Expo Go

cd /home/darley/lacos || exit 1

echo "🔍 DIAGNÓSTICO COMPLETO: Problema QR Code Expo Go"
echo "=================================================="
echo ""

# 1. Verificar IP
echo "1️⃣ Verificando IP da máquina..."
IP=$(hostname -I | awk '{print $1}')
EXPO_IP="192.168.0.20"
echo "   IP atual: $IP"
echo "   IP esperado: $EXPO_IP"
if [ "$IP" != "$EXPO_IP" ]; then
    echo "   ⚠️  IP diferente do esperado!"
    echo "   💡 Usando IP atual: $IP"
    EXPO_IP="$IP"
fi
echo ""

# 2. Verificar porta 8081
echo "2️⃣ Verificando porta 8081..."
if lsof -i :8081 > /dev/null 2>&1; then
    echo "   ✅ Porta 8081 está em uso"
    echo "   Processos usando a porta:"
    lsof -i :8081 | head -5
else
    echo "   ❌ Porta 8081 está livre"
fi
echo ""

# 3. Verificar firewall
echo "3️⃣ Verificando firewall..."
if command -v ufw > /dev/null; then
    UFW_STATUS=$(sudo ufw status 2>/dev/null | head -1)
    echo "   Status: $UFW_STATUS"
    if echo "$UFW_STATUS" | grep -q "active"; then
        echo "   ⚠️  Firewall ativo!"
        if sudo ufw status | grep -q "8081"; then
            echo "   ✅ Porta 8081 permitida no firewall"
        else
            echo "   ❌ Porta 8081 NÃO está permitida no firewall"
            echo "   💡 Execute: sudo ufw allow 8081/tcp"
        fi
    else
        echo "   ✅ Firewall inativo"
    fi
else
    echo "   ℹ️  UFW não instalado"
fi
echo ""

# 4. Verificar conectividade de rede
echo "4️⃣ Verificando conectividade de rede..."
if ping -c 1 -W 2 $EXPO_IP > /dev/null 2>&1; then
    echo "   ✅ IP $EXPO_IP responde ao ping"
else
    echo "   ❌ IP $EXPO_IP não responde ao ping"
    echo "   ⚠️  Pode haver problema de rede"
fi
echo ""

# 5. Verificar configuração Expo
echo "5️⃣ Verificando configuração Expo..."
if [ -f ".expo/settings.json" ]; then
    echo "   ✅ .expo/settings.json existe"
    echo "   Conteúdo:"
    cat .expo/settings.json | head -10
else
    echo "   ⚠️  .expo/settings.json não existe"
fi
echo ""

# 6. Verificar Metro config
echo "6️⃣ Verificando metro.config.js..."
if [ -f "metro.config.js" ]; then
    echo "   ✅ metro.config.js existe"
    if grep -q "192.168.0.20\|$EXPO_IP" metro.config.js; then
        echo "   ✅ IP configurado no Metro"
    else
        echo "   ⚠️  IP não encontrado no Metro config"
    fi
else
    echo "   ⚠️  metro.config.js não existe"
fi
echo ""

# 7. Verificar versão Expo
echo "7️⃣ Verificando versão Expo..."
if command -v npx > /dev/null; then
    EXPO_VERSION=$(npx expo --version 2>/dev/null || echo "não encontrado")
    echo "   Versão: $EXPO_VERSION"
else
    echo "   ❌ npx não encontrado"
fi
echo ""

# 8. Verificar se expo-dev-client está instalado
echo "8️⃣ Verificando expo-dev-client..."
if npm list expo-dev-client > /dev/null 2>&1; then
    echo "   ✅ expo-dev-client instalado"
    echo "   💡 Você pode usar: npx expo start --dev-client"
else
    echo "   ℹ️  expo-dev-client não instalado"
    echo "   💡 Usando Expo Go padrão"
fi
echo ""

# 9. Verificar processos em execução
echo "9️⃣ Verificando processos Expo/Metro..."
EXPO_PROCESSES=$(pgrep -f "expo start\|metro" | wc -l)
if [ "$EXPO_PROCESSES" -gt 0 ]; then
    echo "   ⚠️  Encontrados $EXPO_PROCESSES processos Expo/Metro em execução"
    echo "   Processos:"
    pgrep -af "expo start\|metro" | head -5
else
    echo "   ✅ Nenhum processo Expo/Metro em execução"
fi
echo ""

# 10. Verificar rede Wi-Fi (se possível)
echo "🔟 Verificando informações de rede..."
if command -v ip > /dev/null; then
    echo "   Interfaces de rede:"
    ip addr show | grep "inet " | grep -v "127.0.0.1" | head -3
elif command -v ifconfig > /dev/null; then
    echo "   Interfaces de rede:"
    ifconfig | grep "inet " | grep -v "127.0.0.1" | head -3
fi
echo ""

# 11. Recomendações
echo "═══════════════════════════════════════════════════════════"
echo "💡 RECOMENDAÇÕES:"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "1️⃣  SOLUÇÃO MAIS RÁPIDA: Use Tunnel Mode"
echo "    ./INICIAR_EXPO_TUNNEL.sh"
echo "    ou"
echo "    npx expo start --tunnel --clear"
echo ""
echo "2️⃣  Se tunnel não funcionar, tente LAN mode com IP forçado:"
echo "    REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP npx expo start --lan --clear"
echo ""
echo "3️⃣  Para iOS especificamente:"
echo "    - Certifique-se que iOS e computador estão na mesma Wi-Fi"
echo "    - Verifique se não há 'AP Isolation' no roteador"
echo "    - Use Tunnel Mode se LAN não funcionar"
echo ""
echo "4️⃣  Se nada funcionar, considere migrar para Expo Dev Client:"
echo "    npx expo install expo-dev-client"
echo "    npx expo run:ios"
echo "    npx expo run:android"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
