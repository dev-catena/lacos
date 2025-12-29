#!/bin/bash

# Script para testar se a aplicação está acessível de outros dispositivos

set -e

EXPO_IP="10.102.0.103"
EXPO_PORT="8081"
URL="http://${EXPO_IP}:${EXPO_PORT}"

echo "🧪 TESTANDO ACESSO NA REDE"
echo "==========================="
echo ""

# 1. Verificar se está escutando
echo "1️⃣ Verificando se está escutando..."
if netstat -tuln | grep -q ":$EXPO_PORT"; then
    echo "✅ Porta $EXPO_PORT está em uso"
    
    # Verificar em qual interface está escutando
    LISTEN_INFO=$(netstat -tuln | grep ":$EXPO_PORT")
    echo "   Detalhes: $LISTEN_INFO"
    
    if echo "$LISTEN_INFO" | grep -q "0.0.0.0\|:::"; then
        echo "✅ Está escutando em 0.0.0.0 (todas as interfaces) - CORRETO!"
    else
        echo "⚠️  Pode estar escutando apenas em localhost"
    fi
else
    echo "❌ Porta $EXPO_PORT NÃO está em uso"
    echo "   Aplicação não está rodando"
    exit 1
fi
echo ""

# 2. Testar acesso local
echo "2️⃣ Testando acesso local..."
if curl -s --connect-timeout 3 "http://localhost:${EXPO_PORT}" > /dev/null 2>&1; then
    echo "✅ Acessível localmente (localhost)"
else
    echo "❌ NÃO acessível localmente"
fi
echo ""

# 3. Testar acesso por IP
echo "3️⃣ Testando acesso por IP ($EXPO_IP)..."
if curl -s --connect-timeout 3 "$URL" > /dev/null 2>&1; then
    echo "✅ Acessível por IP ($EXPO_IP)"
else
    echo "❌ NÃO acessível por IP ($EXPO_IP)"
    echo "   Isso explica por que outros dispositivos não conseguem acessar"
fi
echo ""

# 4. Verificar firewall
echo "4️⃣ Verificando firewall..."
if command -v ufw > /dev/null 2>&1; then
    if sudo ufw status 2>/dev/null | grep -q "Status: active"; then
        echo "⚠️  Firewall está ATIVO"
        if sudo ufw status | grep -q "$EXPO_PORT"; then
            echo "✅ Porta $EXPO_PORT está permitida"
        else
            echo "❌ Porta $EXPO_PORT NÃO está permitida"
            echo "   Execute: sudo ufw allow $EXPO_PORT/tcp"
        fi
    else
        echo "✅ Firewall está inativo"
    fi
else
    echo "ℹ️  UFW não instalado"
fi
echo ""

# 5. Resumo
echo "═══════════════════════════════════════════════════════════"
echo "📋 RESUMO"
echo "═══════════════════════════════════════════════════════════"
echo ""

if curl -s --connect-timeout 3 "$URL" > /dev/null 2>&1; then
    echo "✅ Aplicação está acessível por IP!"
    echo ""
    echo "📱 Para acessar de outros dispositivos:"
    echo "   1. Certifique-se que estão na mesma rede Wi-Fi"
    echo "   2. Abra navegador e acesse: $URL"
    echo ""
else
    echo "❌ Aplicação NÃO está acessível por IP"
    echo ""
    echo "💡 SOLUÇÕES:"
    echo ""
    echo "1. Verificar se está escutando em 0.0.0.0:"
    echo "   netstat -tuln | grep $EXPO_PORT"
    echo "   Deve mostrar: 0.0.0.0:$EXPO_PORT ou :::$EXPO_PORT"
    echo ""
    echo "2. Reiniciar com script correto:"
    echo "   ./INICIAR_WEB_IP.sh"
    echo ""
    echo "3. Verificar firewall:"
    echo "   sudo ufw allow $EXPO_PORT/tcp"
    echo ""
    echo "4. Se ainda não funcionar, usar proxy reverso ou ngrok"
    echo ""
fi

echo "═══════════════════════════════════════════════════════════"
echo ""

