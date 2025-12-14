#!/bin/bash

##############################################
# Script para Enviar Scripts de Verificação de Bloqueio
# para o Servidor
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

echo "📦 Enviando Scripts de Verificação de Bloqueio"
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

# Função para copiar arquivos
remote_copy() {
    sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no "$1" "$USER@$SERVER:$2"
}

# Função para executar comandos remotos
remote_exec() {
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USER@$SERVER" "$1"
}

# Verificar se os arquivos existem localmente
echo ""
echo "🔍 Verificando arquivos locais..."

SCRIPTS=(
    "APLICAR_VERIFICACAO_BLOQUEIO.sh"
    "RESTAURAR_ROTAS_COM_BLOQUEIO.sh"
    "README_VERIFICACAO_BLOQUEIO.md"
)

MISSING_FILES=()

for script in "${SCRIPTS[@]}"; do
    if [ ! -f "$script" ]; then
        MISSING_FILES+=("$script")
        echo -e "${RED}❌${NC} $script não encontrado"
    else
        echo -e "${GREEN}✓${NC} $script encontrado"
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}❌ Erro: Alguns arquivos não foram encontrados!${NC}"
    echo "Execute este script no diretório backend-laravel"
    exit 1
fi

# 1. Copiar scripts para /tmp no servidor (onde temos permissão)
echo ""
echo "📤 Enviando scripts para /tmp no servidor..."

remote_copy "APLICAR_VERIFICACAO_BLOQUEIO.sh" "/tmp/APLICAR_VERIFICACAO_BLOQUEIO.sh"
echo -e "${GREEN}✓${NC} APLICAR_VERIFICACAO_BLOQUEIO.sh enviado para /tmp"

remote_copy "RESTAURAR_ROTAS_COM_BLOQUEIO.sh" "/tmp/RESTAURAR_ROTAS_COM_BLOQUEIO.sh"
echo -e "${GREEN}✓${NC} RESTAURAR_ROTAS_COM_BLOQUEIO.sh enviado para /tmp"

remote_copy "README_VERIFICACAO_BLOQUEIO.md" "/tmp/README_VERIFICACAO_BLOQUEIO.md"
echo -e "${GREEN}✓${NC} README_VERIFICACAO_BLOQUEIO.md enviado para /tmp"

# 2. Mover arquivos para o diretório correto com sudo
echo ""
echo "🔧 Movendo arquivos para $REMOTE_PATH (requer sudo)..."
remote_exec "echo '$PASSWORD' | sudo -S mv /tmp/APLICAR_VERIFICACAO_BLOQUEIO.sh $REMOTE_PATH/ 2>/dev/null || sudo mv /tmp/APLICAR_VERIFICACAO_BLOQUEIO.sh $REMOTE_PATH/"
remote_exec "echo '$PASSWORD' | sudo -S mv /tmp/RESTAURAR_ROTAS_COM_BLOQUEIO.sh $REMOTE_PATH/ 2>/dev/null || sudo mv /tmp/RESTAURAR_ROTAS_COM_BLOQUEIO.sh $REMOTE_PATH/"
remote_exec "echo '$PASSWORD' | sudo -S mv /tmp/README_VERIFICACAO_BLOQUEIO.md $REMOTE_PATH/ 2>/dev/null || sudo mv /tmp/README_VERIFICACAO_BLOQUEIO.md $REMOTE_PATH/"
echo -e "${GREEN}✓${NC} Arquivos movidos para $REMOTE_PATH"

# 3. Tornar scripts executáveis e ajustar permissões
echo ""
echo "🔧 Ajustando permissões no servidor..."
remote_exec "echo '$PASSWORD' | sudo -S chmod +x $REMOTE_PATH/APLICAR_VERIFICACAO_BLOQUEIO.sh 2>/dev/null || sudo chmod +x $REMOTE_PATH/APLICAR_VERIFICACAO_BLOQUEIO.sh"
remote_exec "echo '$PASSWORD' | sudo -S chmod +x $REMOTE_PATH/RESTAURAR_ROTAS_COM_BLOQUEIO.sh 2>/dev/null || sudo chmod +x $REMOTE_PATH/RESTAURAR_ROTAS_COM_BLOQUEIO.sh"
remote_exec "echo '$PASSWORD' | sudo -S chown www-data:www-data $REMOTE_PATH/APLICAR_VERIFICACAO_BLOQUEIO.sh 2>/dev/null || sudo chown www-data:www-data $REMOTE_PATH/APLICAR_VERIFICACAO_BLOQUEIO.sh"
remote_exec "echo '$PASSWORD' | sudo -S chown www-data:www-data $REMOTE_PATH/RESTAURAR_ROTAS_COM_BLOQUEIO.sh 2>/dev/null || sudo chown www-data:www-data $REMOTE_PATH/RESTAURAR_ROTAS_COM_BLOQUEIO.sh"
echo -e "${GREEN}✓${NC} Permissões ajustadas"

# 4. Verificar se routes_api_corrigido.php existe localmente e enviar também
if [ -f "routes_api_corrigido.php" ]; then
    echo ""
    echo "📤 Enviando routes_api_corrigido.php (opcional)..."
    remote_copy "routes_api_corrigido.php" "/tmp/routes_api_corrigido.php"
    remote_exec "echo '$PASSWORD' | sudo -S mv /tmp/routes_api_corrigido.php $REMOTE_PATH/ 2>/dev/null || sudo mv /tmp/routes_api_corrigido.php $REMOTE_PATH/"
    echo -e "${GREEN}✓${NC} routes_api_corrigido.php enviado"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Scripts enviados com sucesso!${NC}"
echo "=========================================="
echo ""
echo "📋 Próximos passos no servidor:"
echo ""
echo -e "${YELLOW}Opção 1 (Recomendada):${NC} Aplicar apenas verificação de bloqueio"
echo "   ssh $USER@$SERVER"
echo "   cd $REMOTE_PATH"
echo "   sudo bash APLICAR_VERIFICACAO_BLOQUEIO.sh"
echo ""
echo -e "${YELLOW}Opção 2:${NC} Restaurar todas as rotas"
echo "   ssh $USER@$SERVER"
echo "   cd $REMOTE_PATH"
echo "   sudo bash RESTAURAR_ROTAS_COM_BLOQUEIO.sh"
echo ""
echo -e "${BLUE}Documentação:${NC} $REMOTE_PATH/README_VERIFICACAO_BLOQUEIO.md"
echo ""

