#!/bin/bash

##############################################
# Script para Enviar GroupActivityController
##############################################

# Configurações do servidor
SERVER="192.168.0.20"
USER="darley"
PASSWORD="yhvh77"
REMOTE_PATH="/var/www/lacos-backend"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🚀 Deploy - GroupActivityController"
echo "=========================================="
echo -e "${BLUE}Servidor:${NC} $SERVER"
echo -e "${BLUE}Destino:${NC} $REMOTE_PATH"
echo ""

# Verificar se sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    echo -e "${RED}❌ sshpass não está instalado!${NC}"
    echo "Instalando sshpass..."
    sudo apt-get update && sudo apt-get install -y sshpass
fi

echo -e "${GREEN}✓${NC} sshpass disponível"

# Função para executar comandos remotos
remote_exec() {
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" "$1"
}

# Função para copiar arquivos
remote_copy() {
    sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no "$1" "$USER@$SERVER:$2"
}

# Verificar se o arquivo existe localmente
if [ ! -f "GroupActivityController.php" ]; then
    echo -e "${RED}❌ Erro: GroupActivityController.php não encontrado!${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Arquivo local encontrado"

# 1. Criar diretório se não existir
echo ""
echo "📁 Verificando diretório..."
remote_exec "echo '$PASSWORD' | sudo -S mkdir -p $REMOTE_PATH/app/Http/Controllers/Api"
echo -e "${GREEN}✓${NC} Diretório verificado"

# 2. Fazer backup se existir
echo ""
echo "💾 Fazendo backup do arquivo existente (se houver)..."
remote_exec "if [ -f $REMOTE_PATH/app/Http/Controllers/Api/GroupActivityController.php ]; then echo '$PASSWORD' | sudo -S cp $REMOTE_PATH/app/Http/Controllers/Api/GroupActivityController.php $REMOTE_PATH/app/Http/Controllers/Api/GroupActivityController.php.backup_\$(date +%Y%m%d_%H%M%S); fi"
echo -e "${GREEN}✓${NC} Backup criado (se necessário)"

# 3. Copiar GroupActivityController.php
echo ""
echo "📋 Copiando GroupActivityController.php..."
remote_copy "GroupActivityController.php" "~/GroupActivityController.php"
remote_exec "echo '$PASSWORD' | sudo -S mv ~/GroupActivityController.php $REMOTE_PATH/app/Http/Controllers/Api/GroupActivityController.php"
remote_exec "echo '$PASSWORD' | sudo -S chown www-data:www-data $REMOTE_PATH/app/Http/Controllers/Api/GroupActivityController.php"
remote_exec "echo '$PASSWORD' | sudo -S chmod 644 $REMOTE_PATH/app/Http/Controllers/Api/GroupActivityController.php"
echo -e "${GREEN}✓${NC} GroupActivityController.php copiado"

# 4. Verificar sintaxe PHP
echo ""
echo "🔍 Verificando sintaxe PHP..."
SYNTAX_CHECK=$(remote_exec "cd $REMOTE_PATH && php -l app/Http/Controllers/Api/GroupActivityController.php 2>&1")
if echo "$SYNTAX_CHECK" | grep -q "No syntax errors"; then
    echo -e "${GREEN}✓${NC} GroupActivityController.php: Sintaxe OK"
else
    echo -e "${RED}❌ GroupActivityController.php: Erro de sintaxe!${NC}"
    echo "$SYNTAX_CHECK"
    exit 1
fi

# 5. Limpar cache do Laravel
echo ""
echo "🧹 Limpando cache do Laravel..."
remote_exec "cd $REMOTE_PATH && php artisan config:clear && php artisan cache:clear && php artisan route:clear"
echo -e "${GREEN}✓${NC} Cache limpo"

# 6. Verificar se o arquivo foi copiado corretamente
echo ""
echo "✅ Verificando arquivo no servidor..."
remote_exec "ls -lh $REMOTE_PATH/app/Http/Controllers/Api/GroupActivityController.php"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📝 Arquivo atualizado:"
echo "   • /var/www/lacos-backend/app/Http/Controllers/Api/GroupActivityController.php"
echo ""
echo "🔄 Próximos passos:"
echo "   1. Verificar se a rota /api/activities/recent está funcionando"
echo "   2. Testar no app se as atividades aparecem"
echo ""

