#!/bin/bash

echo "🔍 Testando API Key do Google Maps..."
echo ""

API_KEY="AIzaSyBK7C7316fc5jZAcVFHe_wEdefuZ5fwGqk"

response=$(curl -s "https://maps.googleapis.com/maps/api/place/autocomplete/json?input=Av%20Paulista&key=$API_KEY&language=pt-BR")

status=$(echo $response | grep -o '"status" : "[^"]*"' | cut -d'"' -f4)

echo "Status: $status"
echo ""

if [ "$status" == "OK" ]; then
    echo "✅ API Key está FUNCIONANDO!"
    echo ""
    echo "Lugares encontrados:"
    echo $response | grep -o '"description" : "[^"]*"' | head -3
elif [ "$status" == "REQUEST_DENIED" ]; then
    echo "❌ API Key está BLOQUEADA!"
    echo ""
    echo "Motivo:"
    echo $response | grep -o '"error_message" : "[^"]*"'
    echo ""
    echo "📋 Solução:"
    echo "1. Vá em: https://console.cloud.google.com/apis/credentials"
    echo "2. Clique na sua API Key"
    echo "3. Em 'Restrições de aplicativo', selecione: Nenhuma"
    echo "4. Clique em Salvar"
    echo "5. Aguarde 1-2 minutos e teste novamente"
else
    echo "⚠️ Status desconhecido: $status"
    echo ""
    echo "Resposta completa:"
    echo $response | python3 -m json.tool 2>/dev/null || echo $response
fi

echo ""
echo "---"
echo ""
echo "Para testar manualmente:"
echo "https://maps.googleapis.com/maps/api/place/autocomplete/json?input=Av%20Paulista&key=$API_KEY&language=pt-BR"

