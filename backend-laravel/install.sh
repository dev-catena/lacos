#!/bin/bash

##############################################
# Script de Instalação Rápida
# Backend Laravel - Mídias e Alertas
##############################################

echo "🚀 Instalando Backend - Mídias e Alertas"
echo "=========================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está no diretório do Laravel
if [ ! -f "artisan" ]; then
    echo -e "${RED}❌ Erro: Este script deve ser executado na raiz do projeto Laravel!${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Diretório Laravel detectado"

# Criar diretórios
echo ""
echo "📁 Criando diretórios..."
mkdir -p app/Http/Controllers/Api
mkdir -p app/Models
echo -e "${GREEN}✓${NC} Diretórios criados"

# Copiar Controllers
echo ""
echo "📋 Copiando Controllers..."
if [ -f "../backend-laravel/MediaController.php" ]; then
    cp ../backend-laravel/MediaController.php app/Http/Controllers/Api/
    echo -e "${GREEN}✓${NC} MediaController copiado"
else
    echo -e "${YELLOW}⚠${NC} MediaController não encontrado"
fi

if [ -f "../backend-laravel/AlertController.php" ]; then
    cp ../backend-laravel/AlertController.php app/Http/Controllers/Api/
    echo -e "${GREEN}✓${NC} AlertController copiado"
else
    echo -e "${YELLOW}⚠${NC} AlertController não encontrado"
fi

# Copiar Models
echo ""
echo "🔧 Copiando Models..."
if [ -f "../backend-laravel/GroupMedia.php" ]; then
    cp ../backend-laravel/GroupMedia.php app/Models/
    echo -e "${GREEN}✓${NC} GroupMedia Model copiado"
else
    echo -e "${YELLOW}⚠${NC} GroupMedia Model não encontrado"
fi

if [ -f "../backend-laravel/PatientAlert.php" ]; then
    cp ../backend-laravel/PatientAlert.php app/Models/
    echo -e "${GREEN}✓${NC} PatientAlert Model copiado"
else
    echo -e "${YELLOW}⚠${NC} PatientAlert Model não encontrado"
fi

# Criar Migrations
echo ""
echo "📊 Criando Migrations..."

# Gerar timestamp para migrations
TIMESTAMP=$(date +"%Y_%m_%d_%H%M%S")
TIMESTAMP2=$(date -d "+1 second" +"%Y_%m_%d_%H%M%S")

if [ -f "../backend-laravel/create_group_media_table.php" ]; then
    cp "../backend-laravel/create_group_media_table.php" "database/migrations/${TIMESTAMP}_create_group_media_table.php"
    echo -e "${GREEN}✓${NC} Migration group_media criada"
else
    echo -e "${YELLOW}⚠${NC} Arquivo de migration group_media não encontrado"
fi

if [ -f "../backend-laravel/create_patient_alerts_table.php" ]; then
    cp "../backend-laravel/create_patient_alerts_table.php" "database/migrations/${TIMESTAMP2}_create_patient_alerts_table.php"
    echo -e "${GREEN}✓${NC} Migration patient_alerts criada"
else
    echo -e "${YELLOW}⚠${NC} Arquivo de migration patient_alerts não encontrado"
fi

# Storage Link
echo ""
echo "🔗 Criando link do storage..."
php artisan storage:link
echo -e "${GREEN}✓${NC} Link do storage criado"

# Rodar Migrations
echo ""
echo "⚙️ Executando Migrations..."
read -p "Deseja rodar as migrations agora? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    php artisan migrate
    echo -e "${GREEN}✓${NC} Migrations executadas"
else
    echo -e "${YELLOW}⚠${NC} Migrations não executadas - rode manualmente: php artisan migrate"
fi

# Instruções finais
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Instalação Concluída!${NC}"
echo "=========================================="
echo ""
echo "📝 Próximos passos:"
echo ""
echo "1. Adicione as rotas ao seu routes/api.php"
echo "   Veja: backend-laravel/api_routes.php"
echo ""
echo "2. Configure o .env:"
echo "   FILESYSTEM_DISK=public"
echo "   CRON_TOKEN=seu-token-secreto"
echo ""
echo "3. Configure os Cron Jobs"
echo "   Veja: backend-laravel/INSTALACAO_BACKEND.md"
echo ""
echo "4. Teste os endpoints:"
echo "   GET  /api/groups/{id}/media"
echo "   POST /api/groups/{id}/media"
echo "   GET  /api/groups/{id}/alerts/active"
echo ""
echo -e "${GREEN}Documentação completa:${NC} backend-laravel/INSTALACAO_BACKEND.md"
echo ""

