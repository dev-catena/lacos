#!/bin/bash
echo "🔍 VERIFICANDO ÍCONES NO APP"
echo "============================"
echo ""
echo "1️⃣ Verificando @expo/vector-icons..."
npm list @expo/vector-icons 2>&1 | grep -E "(expo|vector-icons)" || echo "❌ Não encontrado"
echo ""
echo "2️⃣ Verificando se há problemas de import..."
grep -r "from '@expo/vector-icons'" src/ | head -5
echo ""
echo "3️⃣ Verificando uso de Ionicons..."
grep -r "Ionicons" src/screens/Home/DoctorVideoCallScreen.js | head -3
echo ""
echo "✅ Verificação concluída!"
echo ""
echo "💡 Se os ícones não aparecem, tente:"
echo "   1. Limpar cache: npx expo start --clear"
echo "   2. Recarregar o app: pressione 'r' no terminal do Expo"
echo "   3. Verificar se está usando Expo Go atualizado"
