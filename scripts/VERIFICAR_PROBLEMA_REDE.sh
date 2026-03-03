#!/bin/bash

# Script para diagnosticar por que outros dispositivos não conseguem acessar

set -e

EXPO_IP="192.168.0.20"
EXPO_PORT="8081"

echo "🔍 DIAGNÓSTICO: Por que outros dispositivos não conseguem acessar?"
echo "=================================================================="
echo ""

# 1. Verificar se está escutando
echo "1️⃣ Verificando se está escutando..."
LISTEN_INFO=$(netstat -tuln 2>/dev/null | grep ":$EXPO_PORT" || echo "")
if [ -z "$LISTEN_INFO" ]; then
    echo "❌ Porta $EXPO_PORT NÃO está em uso"
    echo "   Aplicação não está rodando!"
    exit 1
fi

echo "✅ Porta $EXPO_PORT está em uso"
echo "   Detalhes: $LISTEN_INFO"
echo ""

# 2. Verificar interface
echo "2️⃣ Verificando interface de escuta..."
if echo "$LISTEN_INFO" | grep -q "0.0.0.0\|:::"; then
    echo "✅ Está escutando em 0.0.0.0 (todas as interfaces) - CORRETO!"
else
    echo "❌ NÃO está escutando em 0.0.0.0"
    echo "   Está escutando apenas em localhost/127.0.0.1"
    echo "   Isso explica por que outros dispositivos não conseguem acessar!"
    echo ""
    echo "💡 SOLUÇÃO:"
    echo "   Execute: ./INICIAR_WEB_IP.sh"
    echo "   Ou: ./INICIAR_WEB_VITE_DIRETO.sh"
    exit 1
fi
echo ""

# 3. Testar acesso local
echo "3️⃣ Testando acesso local..."
if curl -s --connect-timeout 3 "http://localhost:${EXPO_PORT}" > /dev/null 2>&1; then
    echo "✅ Acessível localmente (localhost)"
else
    echo "❌ NÃO acessível localmente"
fi
echo ""

# 4. Testar acesso por IP
echo "4️⃣ Testando acesso por IP ($EXPO_IP)..."
if curl -s --connect-timeout 3 "http://${EXPO_IP}:${EXPO_PORT}" > /dev/null 2>&1; then
    echo "✅ Acessível por IP ($EXPO_IP)"
else
    echo "❌ NÃO acessível por IP ($EXPO_IP)"
    echo "   Isso explica por que outros dispositivos não conseguem acessar!"
    echo ""
    echo "💡 POSSÍVEIS CAUSAS:"
    echo "   1. Servidor web não está escutando em 0.0.0.0"
    echo "   2. Firewall bloqueando"
    echo "   3. Problema de rede"
    exit 1
fi
echo ""

# 5. Verificar IP da máquina
echo "5️⃣ Verificando IP da máquina..."
IP_ATUAL=$(hostname -I | awk '{print $1}')
echo "   IP atual: $IP_ATUAL"
if [ "$IP_ATUAL" != "$EXPO_IP" ]; then
    echo "⚠️  IP atual ($IP_ATUAL) diferente do configurado ($EXPO_IP)"
    echo "   Outros dispositivos devem usar: http://${IP_ATUAL}:${EXPO_PORT}"
fi
echo ""

# 6. Verificar firewall
echo "6️⃣ Verificando firewall..."
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
    echo "ℹ️  UFW não instalado (pode haver outro firewall)"
fi
echo ""

# 7. Verificar rota
echo "7️⃣ Verificando rota de rede..."
if ip route | grep -q "10.102.0"; then
    echo "✅ Rede 10.102.0.x está configurada"
else
    echo "⚠️  Rede 10.102.0.x pode não estar configurada corretamente"
fi
echo ""

# 8. Resumo e recomendações
echo "═══════════════════════════════════════════════════════════"
echo "📋 RESUMO E RECOMENDAÇÕES"
echo "═══════════════════════════════════════════════════════════"
echo ""

if curl -s --connect-timeout 3 "http://${EXPO_IP}:${EXPO_PORT}" > /dev/null 2>&1; then
    echo "✅ Servidor está funcionando corretamente!"
    echo ""
    echo "📱 Para acessar de outros dispositivos:"
    echo "   1. Certifique-se que estão na MESMA rede Wi-Fi"
    echo "   2. Verifique o IP do dispositivo:"
    echo "      - Android: Configurações > Sobre > Status > Endereço IP"
    echo "      - iOS: Configurações > Wi-Fi > (i) > Endereço IP"
    echo "      - Deve estar no mesmo range (ex: 10.102.0.x)"
    echo "   3. Abra navegador e acesse: http://${EXPO_IP}:${EXPO_PORT}"
    echo ""
    echo "🔍 Se ainda não funcionar:"
    echo "   - Verifique se o roteador tem 'Isolamento de AP' ativado"
    echo "   - Tente usar o IP atual da máquina: http://${IP_ATUAL}:${EXPO_PORT}"
    echo "   - Use ngrok como alternativa: ngrok http $EXPO_PORT"
else
    echo "❌ Servidor NÃO está acessível por IP"
    echo ""
    echo "💡 SOLUÇÕES:"
    echo ""
    echo "1. Reiniciar com script que força 0.0.0.0:"
    echo "   ./INICIAR_WEB_IP.sh"
    echo ""
    echo "2. Ou usar Vite diretamente:"
    echo "   ./INICIAR_WEB_VITE_DIRETO.sh"
    echo ""
    echo "3. Verificar firewall:"
    echo "   sudo ufw allow $EXPO_PORT/tcp"
    echo ""
fi

echo "═══════════════════════════════════════════════════════════"
echo ""

