#!/bin/bash

# Script simplificado para enviar arquivos para o servidor
# Execute manualmente com a senha quando solicitado

SERVER="darley@193.203.182.22"
PORT="63022"
TMP_DIR="/tmp"

echo "📤 Enviando arquivos para o servidor..."
echo "Senha: yhvh77"
echo ""

# Enviar arquivos do backend
echo "1. Enviando add_cpf_to_users_table.php..."
scp -P "$PORT" backend-laravel/add_cpf_to_users_table.php "$SERVER:$TMP_DIR/"

echo "2. Enviando AuthController_MODIFICADO_CPF_EMAIL.php..."
scp -P "$PORT" backend-laravel/AuthController_MODIFICADO_CPF_EMAIL.php "$SERVER:$TMP_DIR/"

echo "3. Enviando script de aplicação..."
scp -P "$PORT" scripts/APLICAR_MUDANCAS_CPF_EMAIL.sh "$SERVER:$TMP_DIR/"

echo ""
echo "✅ Arquivos enviados!"
echo ""
echo "📝 Agora execute no servidor:"
echo "   ssh -p $PORT $SERVER"
echo "   sudo bash $TMP_DIR/APLICAR_MUDANCAS_CPF_EMAIL.sh"










