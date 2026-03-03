#!/bin/bash

# Script para FORÇAR Expo Go removendo expo-dev-client do app.json temporariamente

set -e

cd /home/darley/lacos || exit 1

echo "🔧 FORÇANDO Expo Go (removendo expo-dev-client temporariamente)"
echo "================================================================"
echo ""

# 1. Verificar se app.json tem expo-dev-client
if grep -q "expo-dev-client" app.json; then
    echo "⚠️  expo-dev-client encontrado no app.json"
    echo "   Isso está forçando o uso de dev-client"
    echo ""
    
    # Fazer backup
    cp app.json app.json.backup.$(date +%s)
    echo "✅ Backup criado: app.json.backup.*"
    echo ""
    
    # Remover expo-dev-client dos plugins
    echo "📝 Removendo expo-dev-client do app.json..."
    
    # Usar node para fazer a remoção de forma segura
    node << 'EOF'
const fs = require('fs');
const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));

if (appJson.expo && appJson.expo.plugins) {
    // Remover expo-dev-client dos plugins
    appJson.expo.plugins = appJson.expo.plugins.filter(plugin => {
        if (typeof plugin === 'string') {
            return plugin !== 'expo-dev-client';
        }
        // Se for array [plugin, config], verificar o primeiro elemento
        if (Array.isArray(plugin) && plugin[0]) {
            return plugin[0] !== 'expo-dev-client';
        }
        return true;
    });
    
    fs.writeFileSync('app.json', JSON.stringify(appJson, null, 2));
    console.log('✅ expo-dev-client removido do app.json');
} else {
    console.log('⚠️  Não foi possível encontrar plugins no app.json');
}
EOF
    
    echo "✅ app.json atualizado"
else
    echo "✅ expo-dev-client não encontrado no app.json"
fi
echo ""

# 2. Parar processos
echo "2️⃣ Parando processos..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 2
echo "✅ Processos parados"
echo ""

# 3. Limpar cache
echo "3️⃣ Limpando cache..."
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .metro 2>/dev/null || true
echo "✅ Cache limpo"
echo ""

# 4. Configurar .expo/settings.json
echo "4️⃣ Configurando .expo/settings.json..."
mkdir -p .expo
cat > .expo/settings.json << EOF
{
  "hostType": "lan",
  "lanType": "ip",
  "dev": true
}
EOF
echo "✅ Configuração criada"
echo ""

# 5. IP e Porta
EXPO_IP="192.168.0.20"
EXPO_PORT="8081"

# Verificar IP
IP=$(hostname -I | awk '{print $1}')
if [ "$IP" != "$EXPO_IP" ]; then
    read -p "IP atual ($IP) diferente. Usar atual? (s/n) [s]: " USAR_IP
    USAR_IP=${USAR_IP:-s}
    if [ "$USAR_IP" = "s" ]; then
        EXPO_IP="$IP"
    fi
fi

echo ""
echo "📱 Configuração:"
echo "   IP: $EXPO_IP"
echo "   Porta: $EXPO_PORT"
echo "   Modo: Expo Go (dev-client removido)"
echo ""

# 6. Configurar variáveis
export EXPO_NO_DOTENV=1
export REACT_NATIVE_PACKAGER_HOSTNAME=$EXPO_IP
export EXPO_PACKAGER_HOSTNAME=$EXPO_IP
export EXPO_NO_LOCALHOST=1
export EXPO_USE_LOCALHOST=0
export EXPO_USE_DEV_CLIENT=0

echo "═══════════════════════════════════════════════════════════"
echo "🚀 Iniciando Expo Go em TUNNEL MODE..."
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "✅ expo-dev-client foi removido do app.json"
echo "✅ Expo deve usar Expo Go agora"
echo "✅ QR code deve mostrar formato exp://"
echo "✅ Deve abrir no Expo Go (não no navegador)"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   - Se precisar do dev-client depois, restaure:"
echo "     cp app.json.backup.* app.json"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# 7. Iniciar em TUNNEL MODE (não pode usar --host junto com --tunnel)
# Tunnel mode funciona sempre, mesmo em redes diferentes
EXPO_USE_DEV_CLIENT=0 \
EXPO_NO_LOCALHOST=1 \
EXPO_USE_LOCALHOST=0 \
npx expo start --tunnel --clear

