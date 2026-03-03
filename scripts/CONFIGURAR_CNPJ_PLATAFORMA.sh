#!/bin/bash

set -e

# Configurações do servidor
SERVER="192.168.0.20"
USER="darley"
PASSWORD="yhvh77"
REMOTE_APP="/var/www/lacos-backend"

echo "⚙️  Configurando CNPJ da Plataforma..."
echo ""

# Solicitar CNPJ do usuário
read -p "Digite o CNPJ da plataforma (apenas números ou com formatação): " CNPJ_INPUT

if [ -z "$CNPJ_INPUT" ]; then
    echo "❌ CNPJ não informado. Operação cancelada."
    exit 1
fi

# Solicitar nome da plataforma (opcional)
read -p "Digite o nome da plataforma [Laços - Cuidado que conecta]: " PLATFORM_NAME_INPUT
PLATFORM_NAME="${PLATFORM_NAME_INPUT:-Laços - Cuidado que conecta}"

echo ""
echo "📝 Configurando no servidor..."
echo "   CNPJ: $CNPJ_INPUT"
echo "   Nome: $PLATFORM_NAME"
echo ""

# Configurar via SSH
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" "
    export SUDO_PASS='$PASSWORD'
    cd $REMOTE_APP
    
    # Criar arquivo temporário com as configurações
    TMP_ENV=\"/tmp/update_env_\$\$\"
    
    # Backup do .env usando sudo
    if echo \"\$SUDO_PASS\" | sudo -S test -f .env 2>/dev/null; then
        echo \"\$SUDO_PASS\" | sudo -S cp .env .env.backup.\$(date +%Y%m%d_%H%M%S)
    fi
    
    # Ler .env atual usando sudo
    echo \"\$SUDO_PASS\" | sudo -S cat .env > \"\$TMP_ENV\" 2>/dev/null || touch \"\$TMP_ENV\"
    
    # Atualizar ou adicionar PLATFORM_CNPJ
    if grep -q '^PLATFORM_CNPJ=' \"\$TMP_ENV\" 2>/dev/null; then
        sed -i 's|^PLATFORM_CNPJ=.*|PLATFORM_CNPJ=\"$CNPJ_INPUT\"|' \"\$TMP_ENV\"
    else
        echo '' >> \"\$TMP_ENV\"
        echo '# Configuração da Plataforma (Telemedicina)' >> \"\$TMP_ENV\"
        echo 'PLATFORM_CNPJ=\"$CNPJ_INPUT\"' >> \"\$TMP_ENV\"
    fi
    
    # Atualizar ou adicionar PLATFORM_NAME
    if grep -q '^PLATFORM_NAME=' \"\$TMP_ENV\" 2>/dev/null; then
        sed -i 's|^PLATFORM_NAME=.*|PLATFORM_NAME=\"$PLATFORM_NAME\"|' \"\$TMP_ENV\"
    else
        echo 'PLATFORM_NAME=\"$PLATFORM_NAME\"' >> \"\$TMP_ENV\"
    fi
    
    # Copiar arquivo atualizado de volta usando sudo
    echo \"\$SUDO_PASS\" | sudo -S cp \"\$TMP_ENV\" .env
    echo \"\$SUDO_PASS\" | sudo -S chown www-data:www-data .env
    
    # Limpar arquivo temporário
    rm -f \"\$TMP_ENV\"
    
    # Limpar cache de configuração
    echo \"\$SUDO_PASS\" | sudo -S php artisan config:clear
    
    echo '✅ Configuração atualizada com sucesso!'
    echo ''
    echo '📋 Valores configurados:'
    echo \"\$SUDO_PASS\" | sudo -S grep '^PLATFORM_CNPJ=' .env 2>/dev/null | sed 's/PLATFORM_CNPJ=/   CNPJ: /' || echo '   CNPJ: (não encontrado)'
    echo \"\$SUDO_PASS\" | sudo -S grep '^PLATFORM_NAME=' .env 2>/dev/null | sed 's/PLATFORM_NAME=/   Nome: /' || echo '   Nome: (não encontrado)'
"

echo ""
echo "✅ CNPJ da plataforma configurado com sucesso!"
echo ""
echo "📝 Para verificar a configuração, execute no servidor:"
echo "   cd $REMOTE_APP && grep PLATFORM .env"
echo ""

