#!/bin/bash

# Script para ver logs do Laravel no servidor

SERVER="darley@10.102.0.103"
SSH_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

read -sp "Digite a senha do servidor: " SUDO_PASS
echo ""

echo "🔍 Verificando localização dos logs..."
echo ""

# Verificar se o diretório de logs existe
echo "1️⃣ Verificando diretório de logs:"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S ls -la $BACKEND_PATH/storage/logs/ 2>/dev/null || echo 'Diretório não encontrado'"
echo ""

# Verificar arquivos de log
echo "2️⃣ Arquivos de log disponíveis:"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S ls -lah $BACKEND_PATH/storage/logs/*.log 2>/dev/null || echo 'Nenhum arquivo .log encontrado'"
echo ""

# Verificar permissões
echo "3️⃣ Verificando permissões do diretório storage:"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S ls -ld $BACKEND_PATH/storage $BACKEND_PATH/storage/logs 2>/dev/null"
echo ""

# Tentar criar o arquivo de log se não existir
echo "4️⃣ Criando arquivo de log se não existir:"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S touch $BACKEND_PATH/storage/logs/laravel.log && echo '$SUDO_PASS' | sudo -S chmod 666 $BACKEND_PATH/storage/logs/laravel.log && echo '$SUDO_PASS' | sudo -S chown www-data:www-data $BACKEND_PATH/storage/logs/laravel.log && echo '✅ Arquivo criado' || echo '❌ Erro ao criar arquivo'"
echo ""

# Ver últimas linhas do log (se existir)
echo "5️⃣ Últimas 30 linhas do log (se existir):"
sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no $SERVER "echo '$SUDO_PASS' | sudo -S tail -30 $BACKEND_PATH/storage/logs/laravel.log 2>/dev/null || echo 'Arquivo ainda não existe ou está vazio'"
echo ""

echo "✅ Verificação concluída"
echo ""
echo "💡 Para monitorar logs em tempo real, execute no servidor:"
echo "   sudo tail -f $BACKEND_PATH/storage/logs/laravel.log"





