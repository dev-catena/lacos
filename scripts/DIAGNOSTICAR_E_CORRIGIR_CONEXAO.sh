#!/bin/bash

# Script para diagnosticar e corrigir problemas de conexão (Gmail timeout e Expo)

set -e

echo "🔍 DIAGNÓSTICO DE CONEXÃO"
echo "========================="
echo ""

cd /home/darley/lacos || exit 1

# 1. Verificar conectividade básica
echo "1️⃣ Verificando conectividade básica..."
if ping -c 2 -W 2 8.8.8.8 > /dev/null 2>&1; then
    echo "✅ Internet OK"
else
    echo "❌ Sem conectividade com internet"
    exit 1
fi
echo ""

# 2. Verificar DNS
echo "2️⃣ Verificando DNS..."
if nslookup gmail.com > /dev/null 2>&1; then
    echo "✅ DNS funcionando"
else
    echo "⚠️  Problema com DNS, tentando resolver..."
    sudo systemd-resolve --flush-caches 2>/dev/null || true
fi
echo ""

# 3. Testar conexão com Gmail
echo "3️⃣ Testando conexão com Gmail..."
GMAIL_TEST=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 15 https://gmail.com 2>&1)
if [ "$GMAIL_TEST" = "200" ] || [ "$GMAIL_TEST" = "301" ] || [ "$GMAIL_TEST" = "302" ]; then
    echo "✅ Gmail acessível (código: $GMAIL_TEST)"
else
    echo "⚠️  Gmail retornou código: $GMAIL_TEST"
    echo "   Isso pode ser temporário ou problema de rede"
fi
echo ""

# 4. Verificar IP atual
echo "4️⃣ Verificando IP da máquina..."
IP_ATUAL=$(hostname -I | awk '{print $1}')
IP_EXPECTED="10.102.0.103"
echo "   IP atual: $IP_ATUAL"
echo "   IP esperado: $IP_EXPECTED"
if [ "$IP_ATUAL" != "$IP_EXPECTED" ]; then
    echo "   ⚠️  IP diferente do esperado!"
fi
echo ""

# 5. Verificar se Expo está rodando
echo "5️⃣ Verificando se Expo está rodando..."
if lsof -i :8081 > /dev/null 2>&1; then
    echo "✅ Porta 8081 está em uso"
    PID=$(lsof -ti :8081 | head -1)
    echo "   Processo: $(ps -p $PID -o comm= 2>/dev/null || echo 'desconhecido')"
    
    # Testar se está respondendo
    if curl -s --connect-timeout 2 http://localhost:8081/status > /dev/null 2>&1; then
        echo "✅ Expo está respondendo"
    else
        echo "⚠️  Porta 8081 em uso mas não está respondendo"
        echo "   Matando processo antigo..."
        kill -9 $PID 2>/dev/null || true
        sleep 2
    fi
else
    echo "❌ Expo NÃO está rodando (porta 8081 livre)"
    echo "   Este é provavelmente o problema do 'failed to download remoto'"
fi
echo ""

# 6. Verificar firewall
echo "6️⃣ Verificando firewall..."
if command -v ufw > /dev/null 2>&1; then
    UFW_STATUS=$(sudo ufw status 2>/dev/null | head -1 || echo "inativo")
    if echo "$UFW_STATUS" | grep -q "Status: active"; then
        echo "⚠️  Firewall UFW está ATIVO"
        echo "   Verificando regra para porta 8081..."
        if sudo ufw status | grep -q "8081"; then
            echo "✅ Porta 8081 permitida no firewall"
        else
            echo "❌ Porta 8081 NÃO está permitida no firewall"
            echo "   Tentando adicionar regra..."
            echo "   (Execute manualmente: sudo ufw allow 8081/tcp)"
        fi
    else
        echo "✅ Firewall UFW inativo"
    fi
else
    echo "ℹ️  UFW não instalado"
fi
echo ""

# 7. Verificar iptables
echo "7️⃣ Verificando iptables..."
if sudo iptables -L -n 2>/dev/null | grep -q "8081"; then
    echo "ℹ️  iptables tem regras para porta 8081"
else
    echo "ℹ️  Nenhuma regra específica para 8081 em iptables"
fi
echo ""

# 8. Resumo e recomendações
echo "📋 RESUMO E RECOMENDAÇÕES"
echo "=========================="
echo ""

if ! lsof -i :8081 > /dev/null 2>&1; then
    echo "❌ PROBLEMA PRINCIPAL: Expo não está rodando"
    echo ""
    echo "🔧 SOLUÇÃO:"
    echo "   1. Execute um dos scripts para iniciar o Expo:"
    echo "      ./INICIAR_EXPO_IP_FORCADO.sh"
    echo "      ou"
    echo "      ./INICIAR_EXPO_TUNNEL.sh  (recomendado se tiver problemas de rede)"
    echo ""
    echo "   2. Depois de iniciar, o QR code deve aparecer"
    echo "   3. No Expo Go, use a URL: exp://$IP_ATUAL:8081"
    echo ""
fi

if [ "$GMAIL_TEST" != "200" ] && [ "$GMAIL_TEST" != "301" ] && [ "$GMAIL_TEST" != "302" ]; then
    echo "⚠️  Gmail pode estar com problemas temporários"
    echo "   Tente novamente em alguns minutos"
    echo ""
fi

echo "🧪 TESTES ADICIONAIS:"
echo "   1. Testar Expo localmente:"
echo "      curl http://localhost:8081/status"
echo ""
echo "   2. Testar Expo pela rede:"
echo "      curl http://$IP_ATUAL:8081/status"
echo ""
echo "   3. Ver processos Expo:"
echo "      ps aux | grep expo"
echo ""
echo "   4. Ver porta 8081:"
echo "      lsof -i :8081"
echo ""

