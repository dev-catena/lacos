#!/bin/bash

echo "📱 Como ver o QR code do Expo..."
echo ""

cd /home/darley/lacos || exit 1

echo "🔍 Verificando se o Expo está rodando..."
if lsof -i :8081 > /dev/null 2>&1; then
    echo "✅ Expo está rodando na porta 8081"
    echo ""
    echo "📱 Opções para ver o QR code:"
    echo ""
    echo "   1. No terminal onde você rodou 'expo start':"
    echo "      - O QR code deve aparecer automaticamente"
    echo "      - Se não aparecer, pressione 's' para mostrar"
    echo ""
    echo "   2. No navegador:"
    echo "      - Abra: http://localhost:8081"
    echo "      - Você verá o QR code grande"
    echo ""
    echo "   3. URL manual (se precisar):"
    MY_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "SEU_IP")
    echo "      - exp://bmkigtw-darley-8081.exp.direct:80"
    echo "      - Ou: exp://$MY_IP:8081"
    echo ""
    echo "📱 Para conectar:"
    echo "   1. Abra o Expo Go no seu celular"
    echo "   2. Escaneie o QR code"
    echo "   3. Aguarde o app carregar"
    echo ""
else
    echo "❌ Expo não está rodando"
    echo ""
    echo "🚀 Inicie o Expo com:"
    echo "   npm run start:tunnel"
    echo ""
fi

