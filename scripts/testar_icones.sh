#!/bin/bash
echo "🧪 Testando ícones do Ionicons..."
echo ""
echo "Verificando se @expo/vector-icons está instalado:"
npm list @expo/vector-icons 2>&1 | head -3
echo ""
echo "Verificando se as fontes estão sendo carregadas no App.js:"
grep -n "Ionicons.font" App.js || echo "❌ Fontes não encontradas no App.js"
echo ""
echo "✅ Para testar os ícones:"
echo "1. Limpe o cache do Expo Go no dispositivo Android"
echo "2. Reinicie o app"
echo "3. Se ainda não funcionar, execute: npm start -- --clear"
