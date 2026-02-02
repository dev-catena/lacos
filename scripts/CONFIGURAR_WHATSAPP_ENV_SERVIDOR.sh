#!/bin/bash

# Script para configurar variáveis de ambiente do WhatsApp no servidor
SERVER="10.102.0.103"
PORT="63022"
USER="darley"
PASSWORD="yhvh77"
REMOTE_PATH="/var/www/lacos-backend"

echo "🔧 Configurando variáveis de ambiente do WhatsApp..."
echo ""

# Obter API Key do container
echo "1️⃣ Obtendo API Key do container Evolution API..."
API_KEY=$(sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" \
    "echo 'yhvh77' | sudo -S docker inspect evolution-api-lacos 2>/dev/null | grep -oP 'AUTHENTICATION_API_KEY=\K[^\"]+' | head -1 || echo ''")

if [ -z "$API_KEY" ]; then
    # Tentar obter dos logs
    API_KEY=$(sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" \
        "echo 'yhvh77' | sudo -S docker logs evolution-api-lacos 2>&1 | grep -i 'api.*key\|authentication' | grep -oP '[a-f0-9]{64}' | head -1 || echo ''")
fi

if [ -z "$API_KEY" ]; then
    echo "⚠️  Não foi possível obter API Key automaticamente"
    echo "   Você pode gerar uma nova ou usar uma existente"
    read -p "Digite a API Key (ou pressione Enter para gerar uma nova): " API_KEY
    
    if [ -z "$API_KEY" ]; then
        API_KEY=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-f0-9' | fold -w 64 | head -n 1)
        echo "✅ API Key gerada: $API_KEY"
    fi
else
    echo "✅ API Key encontrada: ${API_KEY:0:20}..."
fi

echo ""
echo "2️⃣ Configurando .env..."

sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" << REMOTE_SCRIPT
cd $REMOTE_PATH

# Fazer backup do .env
if [ -f .env ]; then
    sudo cp .env .env.backup.\$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup do .env criado"
fi

# Adicionar ou atualizar variáveis
echo ""
echo "Adicionando/atualizando variáveis no .env..."

# Remover linhas antigas se existirem
sudo sed -i '/^WHATSAPP_API_URL=/d' .env 2>/dev/null || true
sudo sed -i '/^WHATSAPP_API_KEY=/d' .env 2>/dev/null || true
sudo sed -i '/^WHATSAPP_INSTANCE_NAME=/d' .env 2>/dev/null || true

# Adicionar novas variáveis
echo "" >> .env
echo "# WhatsApp/Evolution API Configuration" >> .env
echo "WHATSAPP_API_URL=http://localhost:8080" >> .env
echo "WHATSAPP_API_KEY=$API_KEY" >> .env
echo "WHATSAPP_INSTANCE_NAME=lacos-2fa" >> .env

echo "✅ Variáveis adicionadas ao .env"
echo ""
echo "📋 Variáveis configuradas:"
grep "^WHATSAPP" .env

# Limpar cache
echo ""
echo "🔧 Limpando cache do Laravel..."
echo 'yhvh77' | sudo -S -u www-data php artisan config:clear
echo 'yhvh77' | sudo -S -u www-data php artisan cache:clear

echo ""
echo "✅ Configuração concluída!"
REMOTE_SCRIPT

echo ""
echo "3️⃣ Verificando se instância WhatsApp está criada..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" << REMOTE_SCRIPT
cd $REMOTE_PATH
WHATSAPP_URL=\$(grep WHATSAPP_API_URL .env | cut -d '=' -f2 | tr -d '"' | tr -d "'" || echo "http://localhost:8080")
WHATSAPP_KEY=\$(grep WHATSAPP_API_KEY .env | cut -d '=' -f2 | tr -d '"' | tr -d "'" || echo "")

if [ -n "\$WHATSAPP_KEY" ]; then
    echo "Testando conexão com Evolution API..."
    RESPONSE=\$(curl -s -H "apikey: \$WHATSAPP_KEY" "\$WHATSAPP_URL/instance/fetchInstances" 2>&1)
    
    if echo "\$RESPONSE" | grep -q "lacos-2fa"; then
        echo "✅ Instância 'lacos-2fa' encontrada!"
        echo "\$RESPONSE" | grep -A 5 "lacos-2fa" | head -10
    else
        echo "⚠️  Instância 'lacos-2fa' NÃO encontrada"
        echo "   Você precisa criar a instância. Execute:"
        echo "   export WHATSAPP_API_URL=\$WHATSAPP_URL"
        echo "   export WHATSAPP_API_KEY=\$WHATSAPP_KEY"
        echo "   export WHATSAPP_INSTANCE_NAME=lacos-2fa"
        echo "   sudo -E bash /tmp/CRIAR_INSTANCIA_WHATSAPP.sh"
    fi
else
    echo "❌ WHATSAPP_API_KEY não configurado"
fi
REMOTE_SCRIPT

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "💡 Próximos passos:"
echo "   1. Se a instância não existir, crie-a com o script CRIAR_INSTANCIA_WHATSAPP.sh"
echo "   2. Escaneie o QR Code para conectar o WhatsApp"
echo "   3. Teste enviar um código 2FA"

