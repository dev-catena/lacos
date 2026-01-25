#!/bin/bash

echo "🔨 BUILD NATIVO ANDROID - ÚNICA SOLUÇÃO PARA ÍCONES"
echo "===================================================="
echo ""
echo "⚠️  IMPORTANTE: Build nativo é necessário para ícones funcionarem no Android"
echo ""
echo "1️⃣ Aceitando licenças do Android SDK..."
sudo ./scripts/aceitar_licencas_android.sh

echo ""
echo "2️⃣ Limpando build anterior..."
cd android
./gradlew clean
cd ..

echo ""
echo "3️⃣ Fazendo build nativo..."
echo "   Isso pode demorar vários minutos na primeira vez..."
npx expo run:android

echo ""
echo "✅ Build concluído!"
echo ""
echo "📱 O app será instalado automaticamente no dispositivo conectado"
echo "   Os ícones DEVEM funcionar agora!"
