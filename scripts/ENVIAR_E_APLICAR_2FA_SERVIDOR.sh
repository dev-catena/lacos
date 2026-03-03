#!/bin/bash

# Script para enviar e aplicar 2FA WhatsApp no servidor remoto
# Servidor: 192.168.0.20 (porta 63022)
# Usuário: darley

set -e

SERVER="192.168.0.20"
PORT="63022"
USER="darley"
PASSWORD="yhvh77"
REMOTE_PATH="/var/www/lacos-backend"
SCRIPT_NAME="APLICAR_2FA_WHATSAPP_ONLY_SERVIDOR.sh"

echo "🚀 Enviando script 2FA para o servidor..."
echo "   Servidor: $USER@$SERVER:$PORT"
echo ""

# Verificar se sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass não está instalado!"
    echo "   Instale com: sudo apt-get install sshpass"
    exit 1
fi

# Enviar script para /tmp no servidor
echo "📤 Enviando script para /tmp no servidor..."
sshpass -p "$PASSWORD" scp -P "$PORT" -o StrictHostKeyChecking=no \
    "scripts/$SCRIPT_NAME" \
    "$USER@$SERVER:/tmp/$SCRIPT_NAME"

if [ $? -eq 0 ]; then
    echo "✅ Script enviado com sucesso!"
    echo ""
    echo "📝 Para aplicar no servidor, execute:"
    echo ""
    echo "   ssh -p $PORT $USER@$SERVER"
    echo "   sudo bash /tmp/$SCRIPT_NAME"
    echo ""
    echo "Ou execute automaticamente agora? (s/n)"
    read -r resposta
    
    if [ "$resposta" = "s" ] || [ "$resposta" = "S" ]; then
        echo ""
        echo "🔧 Aplicando script no servidor..."
        # Passar senha do sudo via stdin usando -S
        sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no \
            "$USER@$SERVER" "echo '$PASSWORD' | sudo -S bash /tmp/$SCRIPT_NAME"
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ 2FA aplicado com sucesso no servidor!"
            echo ""
            echo "🔧 Limpando cache do Laravel..."
            # Limpar cache também
            sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no \
                "$USER@$SERVER" "cd $REMOTE_PATH && echo '$PASSWORD' | sudo -S -u www-data php artisan config:clear && echo '$PASSWORD' | sudo -S -u www-data php artisan route:clear && echo '$PASSWORD' | sudo -S -u www-data php artisan cache:clear"
            
            echo ""
            echo "✅ Cache limpo!"
            echo ""
            echo "🎉 Tudo pronto! As rotas de 2FA estão ativas no servidor."
        else
            echo "❌ Erro ao aplicar script no servidor"
            exit 1
        fi
    fi
else
    echo "❌ Erro ao enviar script para o servidor"
    exit 1
fi

