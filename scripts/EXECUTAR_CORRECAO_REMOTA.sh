#!/bin/bash

# Script para executar a correção remotamente com senha do sudo

SSH_USER="darley"
SSH_HOST="192.168.0.20"
SSH_PORT="63022"
SSH_PASS="yhvh77"
SUDO_PASS="yhvh77"

echo "🚀 Executando correção no servidor..."

# Executar o script Python no servidor passando a senha do sudo
sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "echo '$SUDO_PASS' | sudo -S python3 /tmp/corrigir_user_endpoint.py"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Correção aplicada com sucesso!"
    echo ""
    echo "📋 Agora teste no app:"
    echo "   1. Faça upload do certificado"
    echo "   2. Saia e entre no app"
    echo "   3. Vá para: Perfil > Dados Profissionais"
    echo "   4. O card verde deve aparecer!"
else
    echo ""
    echo "⚠️  Se o sudo pedir senha, execute manualmente:"
    echo "   ssh -p $SSH_PORT $SSH_USER@$SSH_HOST"
    echo "   sudo python3 /tmp/corrigir_user_endpoint.py"
fi














