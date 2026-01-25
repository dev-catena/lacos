#!/bin/bash

##############################################
# Script de Deploy Automático para Servidor
# Backend Laravel - Mídias e Alertas (v2)
##############################################

# Configurações do servidor
SERVER="10.102.0.103"
USER="darley"
PASSWORD="yhvh77"
REMOTE_PATH="/var/www/lacos-backend"
TEMP_PATH="/tmp/lacos-deploy"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🚀 Deploy Backend - Mídias e Alertas (v2)"
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

# 1. Criar diretório temporário no servidor
echo ""
echo "📁 Criando diretório temporário..."
remote_exec "rm -rf $TEMP_PATH && mkdir -p $TEMP_PATH/{controllers,models,migrations,docs}"
echo -e "${GREEN}✓${NC} Diretório temporário criado"

# 2. Copiar Controllers para temp
echo ""
echo "📋 Copiando Controllers..."
remote_copy "MediaController.php" "$TEMP_PATH/controllers/MediaController.php"
echo -e "${GREEN}✓${NC} MediaController.php"
remote_copy "AlertController.php" "$TEMP_PATH/controllers/AlertController.php"
echo -e "${GREEN}✓${NC} AlertController.php"

# 3. Copiar Models para temp
echo ""
echo "🔧 Copiando Models..."
remote_copy "GroupMedia.php" "$TEMP_PATH/models/GroupMedia.php"
echo -e "${GREEN}✓${NC} GroupMedia.php"
remote_copy "PatientAlert.php" "$TEMP_PATH/models/PatientAlert.php"
echo -e "${GREEN}✓${NC} PatientAlert.php"

# 4. Copiar Migrations para temp
echo ""
echo "📊 Copiando Migrations..."
TIMESTAMP=$(date +"%Y_%m_%d_%H%M%S")
TIMESTAMP2=$(date -d "+1 second" +"%Y_%m_%d_%H%M%S" 2>/dev/null || date -v+1S +"%Y_%m_%d_%H%M%S")

remote_copy "create_group_media_table.php" "$TEMP_PATH/migrations/${TIMESTAMP}_create_group_media_table.php"
echo -e "${GREEN}✓${NC} create_group_media_table.php"
remote_copy "create_patient_alerts_table.php" "$TEMP_PATH/migrations/${TIMESTAMP2}_create_patient_alerts_table.php"
echo -e "${GREEN}✓${NC} create_patient_alerts_table.php"

# 5. Copiar arquivos de rotas e docs
echo ""
echo "📚 Copiando rotas e documentação..."
remote_copy "api_routes.php" "$TEMP_PATH/docs/api_routes.php"
remote_copy "README.md" "$TEMP_PATH/docs/README_MEDIA_ALERTS.md"
remote_copy "INSTALACAO_BACKEND.md" "$TEMP_PATH/docs/INSTALACAO_MEDIA_ALERTS.md"
echo -e "${GREEN}✓${NC} Arquivos copiados"

# 6. Mover arquivos para destino final (com sudo)
echo ""
echo "📦 Movendo arquivos para destino final..."
remote_exec "echo '$PASSWORD' | sudo -S mkdir -p $REMOTE_PATH/app/Http/Controllers/Api"
remote_exec "echo '$PASSWORD' | sudo -S mkdir -p $REMOTE_PATH/app/Models"
remote_exec "echo '$PASSWORD' | sudo -S mkdir -p $REMOTE_PATH/database/migrations"

remote_exec "echo '$PASSWORD' | sudo -S cp $TEMP_PATH/controllers/MediaController.php $REMOTE_PATH/app/Http/Controllers/Api/"
remote_exec "echo '$PASSWORD' | sudo -S cp $TEMP_PATH/controllers/AlertController.php $REMOTE_PATH/app/Http/Controllers/Api/"
echo -e "${GREEN}✓${NC} Controllers instalados"

remote_exec "echo '$PASSWORD' | sudo -S cp $TEMP_PATH/models/GroupMedia.php $REMOTE_PATH/app/Models/"
remote_exec "echo '$PASSWORD' | sudo -S cp $TEMP_PATH/models/PatientAlert.php $REMOTE_PATH/app/Models/"
echo -e "${GREEN}✓${NC} Models instalados"

remote_exec "echo '$PASSWORD' | sudo -S cp $TEMP_PATH/migrations/*.php $REMOTE_PATH/database/migrations/"
echo -e "${GREEN}✓${NC} Migrations instaladas"

remote_exec "echo '$PASSWORD' | sudo -S cp $TEMP_PATH/docs/* $REMOTE_PATH/"
echo -e "${GREEN}✓${NC} Documentação instalada"

# 7. Ajustar permissões dos arquivos copiados
echo ""
echo "🔒 Ajustando permissões..."
remote_exec "echo '$PASSWORD' | sudo -S chown -R www-data:www-data $REMOTE_PATH/app"
remote_exec "echo '$PASSWORD' | sudo -S chown -R www-data:www-data $REMOTE_PATH/database/migrations"
remote_exec "echo '$PASSWORD' | sudo -S chmod -R 755 $REMOTE_PATH/app"
echo -e "${GREEN}✓${NC} Permissões ajustadas"

# 8. Limpar temp
echo ""
echo "🧹 Limpando arquivos temporários..."
remote_exec "rm -rf $TEMP_PATH"
echo -e "${GREEN}✓${NC} Limpeza concluída"

# 9. Limpar cache Laravel
echo ""
echo "🔄 Limpando cache Laravel..."
remote_exec "cd $REMOTE_PATH && php artisan config:clear"
remote_exec "cd $REMOTE_PATH && php artisan route:clear"
remote_exec "cd $REMOTE_PATH && php artisan cache:clear"
echo -e "${GREEN}✓${NC} Cache limpo"

# 10. Perguntar se deve rodar migrations
echo ""
read -p "Deseja rodar as migrations agora? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "⚙️ Executando migrations..."
    remote_exec "cd $REMOTE_PATH && php artisan migrate"
    echo -e "${GREEN}✓${NC} Migrations executadas"
else
    echo -e "${YELLOW}⚠${NC} Migrations não executadas"
    echo "   Para executar depois: cd $REMOTE_PATH && php artisan migrate"
fi

# Instruções finais
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Deploy Concluído com Sucesso!${NC}"
echo "=========================================="
echo ""
echo "✅ Arquivos instalados:"
echo "   • Controllers: MediaController, AlertController"
echo "   • Models: GroupMedia, PatientAlert"
echo "   • Migrations: group_media, patient_alerts"
echo "   • Docs: README_MEDIA_ALERTS.md, INSTALACAO_MEDIA_ALERTS.md"
echo ""
echo "📝 Próximos passos:"
echo ""
echo "1. ${YELLOW}Adicionar rotas ao routes/api.php:${NC}"
echo "   ssh $USER@$SERVER"
echo "   sudo nano $REMOTE_PATH/routes/api.php"
echo "   (copie o conteúdo de api_routes.php)"
echo ""
echo "2. ${YELLOW}Verificar arquivo de rotas:${NC}"
echo "   cat $REMOTE_PATH/api_routes.php"
echo ""
echo "3. ${YELLOW}Configurar .env:${NC}"
echo "   sudo nano $REMOTE_PATH/.env"
echo "   Adicionar:"
echo "   FILESYSTEM_DISK=public"
echo "   CRON_TOKEN=$(openssl rand -hex 32)"
echo ""
echo "4. ${YELLOW}Testar endpoints:${NC}"
echo "   curl -H 'Authorization: Bearer TOKEN' http://$SERVER/api/groups/1/media"
echo ""
echo "5. ${YELLOW}Configurar Cron Jobs:${NC}"
echo "   crontab -e"
echo "   Veja: $REMOTE_PATH/INSTALACAO_MEDIA_ALERTS.md"
echo ""
echo -e "${BLUE}Documentação disponível em:${NC}"
echo "   • $REMOTE_PATH/README_MEDIA_ALERTS.md"
echo "   • $REMOTE_PATH/INSTALACAO_MEDIA_ALERTS.md"
echo "   • $REMOTE_PATH/api_routes.php"
echo ""

