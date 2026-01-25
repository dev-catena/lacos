#!/bin/bash

##############################################
# Script de Deploy Automático para Servidor
# Backend Laravel - Mídias e Alertas
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

echo "🚀 Deploy Backend - Mídias e Alertas"
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

# 1. Criar diretórios no servidor
echo ""
echo "📁 Criando diretórios no servidor..."
remote_exec "mkdir -p $REMOTE_PATH/app/Http/Controllers/Api"
remote_exec "mkdir -p $REMOTE_PATH/app/Models"
remote_exec "mkdir -p $REMOTE_PATH/database/migrations"
echo -e "${GREEN}✓${NC} Diretórios criados"

# 2. Copiar Controllers
echo ""
echo "📋 Copiando Controllers..."
remote_copy "MediaController.php" "$REMOTE_PATH/app/Http/Controllers/Api/MediaController.php"
echo -e "${GREEN}✓${NC} MediaController.php"
remote_copy "AlertController.php" "$REMOTE_PATH/app/Http/Controllers/Api/AlertController.php"
echo -e "${GREEN}✓${NC} AlertController.php"

# 3. Copiar Models
echo ""
echo "🔧 Copiando Models..."
remote_copy "GroupMedia.php" "$REMOTE_PATH/app/Models/GroupMedia.php"
echo -e "${GREEN}✓${NC} GroupMedia.php"
remote_copy "PatientAlert.php" "$REMOTE_PATH/app/Models/PatientAlert.php"
echo -e "${GREEN}✓${NC} PatientAlert.php"

# 4. Copiar Migrations
echo ""
echo "📊 Copiando Migrations..."
TIMESTAMP=$(date +"%Y_%m_%d_%H%M%S")
TIMESTAMP2=$(date -d "+1 second" +"%Y_%m_%d_%H%M%S" 2>/dev/null || date -v+1S +"%Y_%m_%d_%H%M%S")

remote_copy "create_group_media_table.php" "$REMOTE_PATH/database/migrations/${TIMESTAMP}_create_group_media_table.php"
echo -e "${GREEN}✓${NC} create_group_media_table.php"
remote_copy "create_patient_alerts_table.php" "$REMOTE_PATH/database/migrations/${TIMESTAMP2}_create_patient_alerts_table.php"
echo -e "${GREEN}✓${NC} create_patient_alerts_table.php"

# 5. Copiar arquivo de rotas
echo ""
echo "🛣️ Copiando rotas..."
remote_copy "api_routes.php" "$REMOTE_PATH/api_routes.php"
echo -e "${GREEN}✓${NC} api_routes.php"

# 6. Copiar documentação
echo ""
echo "📚 Copiando documentação..."
remote_copy "README.md" "$REMOTE_PATH/README_MEDIA_ALERTS.md"
remote_copy "INSTALACAO_BACKEND.md" "$REMOTE_PATH/INSTALACAO_MEDIA_ALERTS.md"
echo -e "${GREEN}✓${NC} Documentação copiada"

# 7. Criar storage link
echo ""
echo "🔗 Criando link do storage..."
remote_exec "cd $REMOTE_PATH && php artisan storage:link"
echo -e "${GREEN}✓${NC} Storage link criado"

# 8. Perguntar se deve rodar migrations
echo ""
read -p "Deseja rodar as migrations agora? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "⚙️ Executando migrations..."
    remote_exec "cd $REMOTE_PATH && php artisan migrate"
    echo -e "${GREEN}✓${NC} Migrations executadas"
else
    echo -e "${YELLOW}⚠${NC} Migrations não executadas"
fi

# 9. Limpar cache
echo ""
echo "🧹 Limpando cache..."
remote_exec "cd $REMOTE_PATH && php artisan config:clear"
remote_exec "cd $REMOTE_PATH && php artisan route:clear"
remote_exec "cd $REMOTE_PATH && php artisan cache:clear"
echo -e "${GREEN}✓${NC} Cache limpo"

# 10. Ajustar permissões
echo ""
echo "🔒 Ajustando permissões..."
remote_exec "cd $REMOTE_PATH && chmod -R 775 storage bootstrap/cache"
remote_exec "cd $REMOTE_PATH && chown -R www-data:www-data storage bootstrap/cache"
echo -e "${GREEN}✓${NC} Permissões ajustadas"

# Instruções finais
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Deploy Concluído!${NC}"
echo "=========================================="
echo ""
echo "📝 Próximos passos no servidor:"
echo ""
echo "1. Adicione as rotas ao routes/api.php:"
echo -e "   ${YELLOW}ssh $USER@$SERVER${NC}"
echo -e "   ${YELLOW}nano $REMOTE_PATH/routes/api.php${NC}"
echo "   (copie o conteúdo de api_routes.php)"
echo ""
echo "2. Configure o .env:"
echo -e "   ${YELLOW}nano $REMOTE_PATH/.env${NC}"
echo "   Adicione:"
echo "   FILESYSTEM_DISK=public"
echo "   CRON_TOKEN=seu-token-secreto"
echo ""
echo "3. Configure os Cron Jobs:"
echo -e "   ${YELLOW}crontab -e${NC}"
echo "   Veja: INSTALACAO_MEDIA_ALERTS.md"
echo ""
echo "4. Teste os endpoints:"
echo "   GET  http://$SERVER/api/groups/{id}/media"
echo "   POST http://$SERVER/api/groups/{id}/media"
echo "   GET  http://$SERVER/api/groups/{id}/alerts/active"
echo ""
echo -e "${BLUE}Documentação copiada para:${NC}"
echo "   $REMOTE_PATH/README_MEDIA_ALERTS.md"
echo "   $REMOTE_PATH/INSTALACAO_MEDIA_ALERTS.md"
echo ""

