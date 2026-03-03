#!/bin/bash

echo "🔓 Abrindo porta 8081 no firewall para permitir conexão do Android..."
echo ""

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Este script precisa ser executado com sudo"
    echo ""
    echo "Execute:"
    echo "   sudo ./scripts/ABRIR_FIREWALL_8081.sh"
    echo ""
    exit 1
fi

# Verificar se ufw está instalado
if ! command -v ufw > /dev/null 2>&1; then
    echo "❌ UFW não está instalado"
    echo "   Instale com: sudo apt install ufw"
    exit 1
fi

echo "📊 Status atual do firewall:"
ufw status | head -10
echo ""

# Abrir porta 8081
echo "🔓 Abrindo porta 8081/tcp..."
ufw allow 8081/tcp
echo ""

# Verificar se foi adicionada
echo "✅ Regra adicionada. Status atualizado:"
ufw status | grep 8081
echo ""

echo "🎉 Porta 8081 está aberta!"
echo ""
echo "💡 Agora tente conectar o Android novamente"
echo "   Se ainda não funcionar, verifique:"
echo "   1. Celular e PC na mesma rede Wi-Fi"
echo "   2. IP do PC é 192.168.0.20"
echo "   3. Expo Go está atualizado no celular"















