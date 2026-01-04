#!/bin/bash

# Script para diagnosticar por que QR code é lido mas app não abre

echo "🔍 Diagnosticando problema: QR code lido mas app não abre"
echo "=========================================================="
echo ""

cd /home/darley/lacos || exit 1

# 1. Verificar se Expo está rodando
echo "1️⃣ Verificando se Expo está rodando..."
if lsof -ti :8081 >/dev/null 2>&1; then
    echo "   ✅ Porta 8081 está em uso (Expo provavelmente rodando)"
    PID=$(lsof -ti :8081 | head -1)
    echo "   📌 PID: $PID"
    ps -p $PID -o cmd= | head -1
else
    echo "   ❌ Porta 8081 NÃO está em uso"
    echo "   💡 Execute: npx expo start"
fi
echo ""

# 2. Verificar formato do QR code
echo "2️⃣ Verificando formato do QR code..."
echo "   O QR code deve mostrar: exp://192.168.1.105:8081"
echo "   NÃO deve mostrar: http://localhost:8081"
echo "   NÃO deve mostrar: http://192.168.1.105:8081"
echo ""

# 3. Verificar se expo-dev-client está causando problema
echo "3️⃣ Verificando expo-dev-client..."
if grep -q "expo-dev-client" package.json; then
    echo "   ⚠️  expo-dev-client está instalado"
    echo "   💡 Isso pode fazer o Expo gerar QR code para dev-client"
    echo "   💡 Solução: ./scripts/USAR_EXPO_GO_APENAS.sh"
else
    echo "   ✅ expo-dev-client não está instalado"
fi
echo ""

# 4. Verificar IP e rede
echo "4️⃣ Verificando IP e rede..."
CURRENT_IP=$(hostname -I | awk '{print $1}')
EXPECTED_IP="192.168.1.105"
echo "   IP atual: $CURRENT_IP"
echo "   IP esperado: $EXPECTED_IP"
if [ "$CURRENT_IP" = "$EXPECTED_IP" ]; then
    echo "   ✅ IP correto"
else
    echo "   ⚠️  IP diferente do esperado"
    echo "   💡 Atualize o script com o IP correto"
fi
echo ""

# 5. Verificar se dispositivo está na mesma rede
echo "5️⃣ Verificando rede..."
echo "   📱 Certifique-se que:"
echo "   - Dispositivo e computador estão na mesma Wi-Fi"
echo "   - Firewall não está bloqueando porta 8081"
echo "   - VPN está desativada (se houver)"
echo ""

# 6. Verificar Expo Go no dispositivo
echo "6️⃣ Verificando Expo Go no dispositivo..."
echo "   📱 No seu dispositivo Android:"
echo "   - Expo Go está instalado?"
echo "   - Permissão de câmera está concedida?"
echo "   - Tente abrir Expo Go manualmente primeiro"
echo ""

# 7. Soluções
echo "🔧 SOLUÇÕES:"
echo ""
echo "Solução 1: Forçar Expo Go"
echo "   ./scripts/USAR_EXPO_GO_APENAS.sh"
echo ""
echo "Solução 2: Usar Tunnel Mode (mais confiável)"
echo "   npx expo start --tunnel --clear"
echo ""
echo "Solução 3: Verificar logs do Expo"
echo "   Veja o terminal onde o Expo está rodando"
echo "   Procure por erros ou avisos"
echo ""
echo "Solução 4: Limpar tudo e reiniciar"
echo "   pkill -f expo"
echo "   pkill -f metro"
echo "   rm -rf .expo"
echo "   rm -rf node_modules/.cache"
echo "   npx expo start --tunnel --clear"
echo ""





