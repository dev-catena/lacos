#!/bin/bash

##############################################
# Script para Enviar Correções de Atividades
# GroupActivity.php e MedicationController.php
##############################################

# Configurações do servidor
SERVER="193.203.182.22"
USER="darley"
PASSWORD="yhvh77"
REMOTE_PATH="/var/www/lacos-backend"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🚀 Deploy - Correções de Atividades"
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

# Verificar se os arquivos existem localmente
if [ ! -f "GroupActivity.php" ]; then
    echo -e "${RED}❌ Erro: GroupActivity.php não encontrado!${NC}"
    exit 1
fi

if [ ! -f "MedicationController.php" ]; then
    echo -e "${RED}❌ Erro: MedicationController.php não encontrado!${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Arquivos locais encontrados"

# 1. Fazer backup dos arquivos existentes
echo ""
echo "💾 Fazendo backup dos arquivos existentes..."
remote_exec "echo '$PASSWORD' | sudo -S cp $REMOTE_PATH/app/Models/GroupActivity.php $REMOTE_PATH/app/Models/GroupActivity.php.backup_\$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo 'Arquivo GroupActivity.php não existe ainda'"
remote_exec "echo '$PASSWORD' | sudo -S cp $REMOTE_PATH/app/Http/Controllers/Api/MedicationController.php $REMOTE_PATH/app/Http/Controllers/Api/MedicationController.php.backup_\$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo 'Arquivo MedicationController.php não existe ainda'"
echo -e "${GREEN}✓${NC} Backups criados"

# 2. Copiar GroupActivity.php
echo ""
echo "📋 Copiando GroupActivity.php..."
remote_copy "GroupActivity.php" "~/GroupActivity.php"
remote_exec "echo '$PASSWORD' | sudo -S mv ~/GroupActivity.php $REMOTE_PATH/app/Models/GroupActivity.php"
remote_exec "echo '$PASSWORD' | sudo -S chown www-data:www-data $REMOTE_PATH/app/Models/GroupActivity.php"
remote_exec "echo '$PASSWORD' | sudo -S chmod 644 $REMOTE_PATH/app/Models/GroupActivity.php"
echo -e "${GREEN}✓${NC} GroupActivity.php copiado"

# 3. Copiar MedicationController.php
echo ""
echo "📋 Copiando MedicationController.php..."
remote_copy "MedicationController.php" "~/MedicationController.php"
remote_exec "echo '$PASSWORD' | sudo -S mv ~/MedicationController.php $REMOTE_PATH/app/Http/Controllers/Api/MedicationController.php"
remote_exec "echo '$PASSWORD' | sudo -S chown www-data:www-data $REMOTE_PATH/app/Http/Controllers/Api/MedicationController.php"
remote_exec "echo '$PASSWORD' | sudo -S chmod 644 $REMOTE_PATH/app/Http/Controllers/Api/MedicationController.php"
echo -e "${GREEN}✓${NC} MedicationController.php copiado"

# 4. Verificar sintaxe PHP
echo ""
echo "🔍 Verificando sintaxe PHP..."
SYNTAX_CHECK=$(remote_exec "cd $REMOTE_PATH && php -l app/Models/GroupActivity.php 2>&1")
if echo "$SYNTAX_CHECK" | grep -q "No syntax errors"; then
    echo -e "${GREEN}✓${NC} GroupActivity.php: Sintaxe OK"
else
    echo -e "${RED}❌ GroupActivity.php: Erro de sintaxe!${NC}"
    echo "$SYNTAX_CHECK"
fi

SYNTAX_CHECK=$(remote_exec "cd $REMOTE_PATH && php -l app/Http/Controllers/Api/MedicationController.php 2>&1")
if echo "$SYNTAX_CHECK" | grep -q "No syntax errors"; then
    echo -e "${GREEN}✓${NC} MedicationController.php: Sintaxe OK"
else
    echo -e "${RED}❌ MedicationController.php: Erro de sintaxe!${NC}"
    echo "$SYNTAX_CHECK"
fi

# 5. Limpar cache do Laravel
echo ""
echo "🧹 Limpando cache do Laravel..."
remote_exec "cd $REMOTE_PATH && php artisan config:clear && php artisan cache:clear && php artisan route:clear"
echo -e "${GREEN}✓${NC} Cache limpo"

# 6. Verificar se os arquivos foram copiados corretamente
echo ""
echo "✅ Verificando arquivos no servidor..."
remote_exec "ls -lh $REMOTE_PATH/app/Models/GroupActivity.php"
remote_exec "ls -lh $REMOTE_PATH/app/Http/Controllers/Api/MedicationController.php"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📝 Arquivos atualizados:"
echo "   • /var/www/lacos-backend/app/Models/GroupActivity.php"
echo "   • /var/www/lacos-backend/app/Http/Controllers/Api/MedicationController.php"
echo ""
echo "🔄 Próximos passos:"
echo "   1. Testar concluir um medicamento no app"
echo "   2. Testar descontinuar um medicamento no app"
echo "   3. Testar cadastrar uma receita no app"
echo "   4. Verificar se as atividades aparecem na Home"
echo ""

