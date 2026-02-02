#!/bin/bash

# Script para verificar e corrigir problemas com Metro

set -e

cd /home/darley/lacos || exit 1

echo "🔍 VERIFICANDO METRO E CONECTIVIDADE"
echo "====================================="
echo ""

# 1. Verificar se Metro está rodando
echo "1️⃣ Verificando se Metro está rodando..."
if lsof -i :8081 > /dev/null 2>&1; then
    echo "✅ Metro está rodando na porta 8081"
    PID=$(lsof -ti :8081 | head -1)
    echo "   PID: $PID"
else
    echo "❌ Metro NÃO está rodando"
fi
echo ""

# 2. Testar conectividade local
echo "2️⃣ Testando conectividade local..."
if curl -s --connect-timeout 3 http://localhost:8081/status > /dev/null 2>&1; then
    echo "✅ Metro responde em localhost:8081"
else
    echo "❌ Metro NÃO responde em localhost:8081"
fi
echo ""

# 3. Testar conectividade por IP
IP=$(hostname -I | awk '{print $1}')
echo "3️⃣ Testando conectividade por IP ($IP)..."
if curl -s --connect-timeout 3 http://${IP}:8081/status > /dev/null 2>&1; then
    echo "✅ Metro responde em ${IP}:8081"
else
    echo "❌ Metro NÃO responde em ${IP}:8081"
    echo ""
    echo "⚠️  PROBLEMA: Metro não está acessível pela rede!"
    echo ""
    echo "💡 SOLUÇÕES:"
    echo "   1. Use Tunnel Mode (não precisa de Metro local):"
    echo "      ./SOLUCAO_SEM_METRO.sh"
    echo ""
    echo "   2. Verificar firewall:"
    echo "      sudo ufw allow 8081/tcp"
    echo ""
    echo "   3. Verificar se Metro está escutando em 0.0.0.0:"
    echo "      netstat -tuln | grep 8081"
    echo ""
fi
echo ""

# 4. Verificar firewall
echo "4️⃣ Verificando firewall..."
if command -v ufw > /dev/null 2>&1; then
    if sudo ufw status 2>/dev/null | grep -q "Status: active"; then
        echo "⚠️  Firewall UFW está ATIVO"
        if sudo ufw status | grep -q "8081"; then
            echo "✅ Porta 8081 está permitida"
        else
            echo "❌ Porta 8081 NÃO está permitida"
            echo "   Execute: sudo ufw allow 8081/tcp"
        fi
    else
        echo "✅ Firewall UFW está inativo"
    fi
else
    echo "ℹ️  UFW não instalado"
fi
echo ""

# 5. Verificar iptables
echo "5️⃣ Verificando iptables..."
if sudo iptables -L -n 2>/dev/null | grep -q "8081"; then
    echo "ℹ️  iptables tem regras para porta 8081"
else
    echo "ℹ️  Nenhuma regra específica para 8081 em iptables"
fi
echo ""

# 6. Resumo e recomendações
echo "═══════════════════════════════════════════════════════════"
echo "📋 RESUMO E RECOMENDAÇÕES"
echo "═══════════════════════════════════════════════════════════"
echo ""

if ! curl -s --connect-timeout 3 http://${IP}:8081/status > /dev/null 2>&1; then
    echo "❌ PROBLEMA: Metro não está acessível pela rede"
    echo ""
    echo "✅ SOLUÇÃO RECOMENDADA: Use Tunnel Mode"
    echo "   ./SOLUCAO_SEM_METRO.sh"
    echo ""
    echo "   Vantagens:"
    echo "   - Não precisa de configuração de rede"
    echo "   - Funciona em qualquer rede"
    echo "   - Não depende de Metro local"
    echo ""
else
    echo "✅ Metro está acessível!"
    echo ""
    echo "💡 Se ainda não conectar, tente:"
    echo "   1. Usar Tunnel Mode: ./SOLUCAO_SEM_METRO.sh"
    echo "   2. Verificar se iOS/Android estão na mesma rede"
    echo "   3. Usar URL manualmente: exp://${IP}:8081"
    echo ""
fi

