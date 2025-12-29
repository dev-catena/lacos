#!/bin/bash

echo "🔍 Verificando firewall e conectividade na porta 8081..."
echo ""

# Verificar se a porta está aberta
echo "📊 Status da porta 8081:"
netstat -tlnp | grep 8081 || ss -tlnp | grep 8081
echo ""

# Verificar firewall (sem sudo para não pedir senha)
echo "🔒 Verificando firewall..."
if command -v ufw > /dev/null 2>&1; then
    echo "UFW encontrado. Status:"
    ufw status | head -5 || echo "Não foi possível verificar (precisa de sudo)"
else
    echo "UFW não encontrado"
fi
echo ""

# Testar conectividade
echo "🌐 Testando conectividade:"
echo "   IP local: $(hostname -I | awk '{print $1}')"
echo "   IP esperado: 10.102.0.103"
echo ""

# Verificar se o Metro está escutando corretamente
echo "📱 Verificando se Metro está acessível:"
if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://10.102.0.103:8081/status 2>/dev/null | grep -q "200\|404"; then
    echo "   ✅ Metro está respondendo em http://10.102.0.103:8081"
else
    echo "   ❌ Metro NÃO está respondendo em http://10.102.0.103:8081"
    echo "   ⚠️  Pode ser firewall ou Metro não está escutando no IP correto"
fi
echo ""

echo "💡 Se o Android não conectar, tente:"
echo "   1. Verificar se celular e PC estão na mesma rede Wi-Fi"
echo "   2. Abrir porta 8081 no firewall: sudo ufw allow 8081/tcp"
echo "   3. Verificar se o IP do PC é realmente 10.102.0.103"




