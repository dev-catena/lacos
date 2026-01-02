#!/bin/bash
set -e
cd /home/darley/lacos || exit 1

echo "🔧 Corrigindo problema de ícones no Android..."
echo ""
echo "📱 Este problema geralmente acontece quando:"
echo "   1. Cache do Expo Go está corrompido"
echo "   2. Expo Go precisa ser atualizado"
echo "   3. Fontes de ícones não estão carregando"
echo ""
echo "🛑 Parando processos Expo/Metro..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
sleep 2

echo "🧹 Limpando cache do Expo..."
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

echo ""
echo "✅ Cache limpo!"
echo ""
echo "📋 PRÓXIMOS PASSOS NO SEU ANDROID:"
echo ""
echo "1️⃣  Limpar cache do Expo Go:"
echo "   - Abra Configurações do Android"
echo "   - Vá em Apps → Expo Go"
echo "   - Toque em 'Armazenamento'"
echo "   - Toque em 'Limpar cache'"
echo "   - Toque em 'Limpar dados' (se necessário)"
echo ""
echo "2️⃣  Atualizar Expo Go:"
echo "   - Abra a Play Store"
echo "   - Procure por 'Expo Go'"
echo "   - Atualize se houver atualização disponível"
echo ""
echo "3️⃣  Reiniciar o app:"
echo "   - Feche completamente o Expo Go"
echo "   - Abra novamente"
echo "   - Escaneie o QR code novamente"
echo ""
echo "🚀 Reiniciando Expo em TUNNEL MODE..."
npx expo start --tunnel --clear


