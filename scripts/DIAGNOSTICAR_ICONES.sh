#!/bin/bash

echo "🔍 DIAGNÓSTICO DE ÍCONES"
echo "========================"
echo ""

cd /home/darley/lacos || exit 1

echo "1️⃣ Verificando @expo/vector-icons..."
npm list @expo/vector-icons 2>&1 | grep -E "(expo|vector-icons)" || echo "❌ Não encontrado"
echo ""

echo "2️⃣ Verificando se há problemas de import..."
grep -r "from '@expo/vector-icons'" src/ | wc -l | xargs echo "   Arquivos usando Ionicons:"
echo ""

echo "3️⃣ Verificando uso de Ionicons em DoctorVideoCallScreen..."
grep -c "Ionicons" src/screens/Home/DoctorVideoCallScreen.js | xargs echo "   Ocorrências:"
echo ""

echo "4️⃣ Verificando se IconWrapper existe..."
if [ -f "src/components/IconWrapper.js" ]; then
    echo "   ✅ IconWrapper.js existe"
else
    echo "   ❌ IconWrapper.js NÃO existe"
fi
echo ""

echo "5️⃣ Verificando configuração do webpack..."
if [ -f "webpack.config.js" ]; then
    echo "   ✅ webpack.config.js existe"
    echo "   Conteúdo:"
    cat webpack.config.js | head -5
else
    echo "   ⚠️ webpack.config.js não existe (pode ser normal)"
fi
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "💡 SOLUÇÕES RECOMENDADAS:"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "1. Limpar cache do Expo:"
echo "   npx expo start --clear"
echo ""
echo "2. Limpar cache do navegador:"
echo "   - Abrir DevTools (F12)"
echo "   - Clicar com botão direito no botão de recarregar"
echo "   - Escolher 'Limpar cache e recarregar forçado'"
echo ""
echo "3. Verificar console do navegador:"
echo "   - Abrir DevTools (F12)"
echo "   - Verificar se há erros relacionados a fontes"
echo ""
echo "4. Testar em modo anônimo do navegador"
echo ""
echo "5. Se persistir, pode ser necessário usar ícones SVG"
echo ""










