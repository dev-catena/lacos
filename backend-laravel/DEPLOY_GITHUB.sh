#!/bin/bash

##############################################
# Script para fazer deploy do backend Laravel
# para o repositório GitHub
# https://github.com/dev-catena/gateway-lacos-.git
##############################################

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
REPO_URL="https://github.com/dev-catena/gateway-lacos-.git"
REPO_NAME="gateway-lacos-"
CURRENT_DIR=$(pwd)
BACKEND_DIR="$(dirname "$0")"

echo -e "${BLUE}🚀 Deploy Backend Laravel para GitHub${NC}"
echo "=========================================="
echo -e "${BLUE}Repositório:${NC} $REPO_URL"
echo -e "${BLUE}Diretório:${NC} $BACKEND_DIR"
echo ""

# Verificar se estamos no diretório correto
if [ ! -d "$BACKEND_DIR/app" ]; then
    echo -e "${RED}❌ Erro: Diretório app não encontrado!${NC}"
    echo "Execute este script a partir do diretório backend-laravel"
    exit 1
fi

# Navegar para o diretório do backend
cd "$BACKEND_DIR"

# Verificar se git está instalado
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git não está instalado!${NC}"
    echo "Instale o git: sudo apt-get install git"
    exit 1
fi

echo -e "${GREEN}✓${NC} Git disponível"
echo ""

# Verificar se já existe um repositório git
if [ -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Repositório git já existe${NC}"
    echo "Verificando remoto..."
    
    # Verificar se o remoto já está configurado
    if git remote get-url origin &> /dev/null; then
        CURRENT_REMOTE=$(git remote get-url origin)
        echo -e "${BLUE}Remoto atual:${NC} $CURRENT_REMOTE"
        
        if [ "$CURRENT_REMOTE" != "$REPO_URL" ]; then
            echo -e "${YELLOW}⚠️  Remoto diferente detectado${NC}"
            read -p "Deseja alterar o remoto para $REPO_URL? (s/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Ss]$ ]]; then
                git remote set-url origin "$REPO_URL"
                echo -e "${GREEN}✓${NC} Remoto atualizado"
            fi
        else
            echo -e "${GREEN}✓${NC} Remoto já está configurado corretamente"
        fi
    else
        echo "Adicionando remoto..."
        git remote add origin "$REPO_URL"
        echo -e "${GREEN}✓${NC} Remoto adicionado"
    fi
else
    echo "Inicializando repositório git..."
    git init
    git remote add origin "$REPO_URL"
    echo -e "${GREEN}✓${NC} Repositório inicializado"
fi

echo ""

# Verificar se .gitignore existe
if [ ! -f ".gitignore" ]; then
    echo -e "${YELLOW}⚠️  .gitignore não encontrado${NC}"
    echo "Criando .gitignore padrão para Laravel..."
    # O .gitignore já deve ter sido criado, mas vamos verificar
    if [ ! -f ".gitignore" ]; then
        echo -e "${RED}❌ Erro ao criar .gitignore${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓${NC} .gitignore verificado"
echo ""

# Verificar status do git
echo "📋 Verificando status do repositório..."
git status --short

echo ""
read -p "Deseja continuar com o commit e push? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Operação cancelada${NC}"
    exit 0
fi

# Adicionar todos os arquivos (respeitando .gitignore)
echo ""
echo "📦 Adicionando arquivos ao staging..."
git add .

# Verificar se há mudanças para commitar
if git diff --staged --quiet; then
    echo -e "${YELLOW}⚠️  Nenhuma mudança para commitar${NC}"
    echo "Verificando se já existe um commit..."
    
    if git rev-parse --verify HEAD &> /dev/null; then
        echo -e "${GREEN}✓${NC} Já existe um commit. Fazendo push..."
        git push -u origin main 2>&1 || git push -u origin master 2>&1
        echo ""
        echo -e "${GREEN}✅ Deploy concluído!${NC}"
        exit 0
    else
        echo -e "${RED}❌ Nenhum commit encontrado e nenhuma mudança para commitar${NC}"
        exit 1
    fi
fi

# Fazer commit
echo ""
echo "💾 Criando commit..."
COMMIT_MESSAGE="feat: deploy inicial do backend Laravel gateway

- Estrutura completa do Laravel
- Controllers da API
- Rotas configuradas
- Models e Migrations
- Configurações do gateway"

git commit -m "$COMMIT_MESSAGE"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao fazer commit${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Commit criado"
echo ""

# Fazer push
echo "🚀 Fazendo push para o GitHub..."
echo ""

# Tentar push para main primeiro, depois master
if git push -u origin main 2>&1; then
    echo ""
    echo -e "${GREEN}✅ Push para 'main' concluído com sucesso!${NC}"
elif git push -u origin master 2>&1; then
    echo ""
    echo -e "${GREEN}✅ Push para 'master' concluído com sucesso!${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  Tentando criar branch main...${NC}"
    git branch -M main
    if git push -u origin main 2>&1; then
        echo ""
        echo -e "${GREEN}✅ Push para 'main' concluído com sucesso!${NC}"
    else
        echo ""
        echo -e "${RED}❌ Erro ao fazer push${NC}"
        echo ""
        echo "Possíveis causas:"
        echo "1. Repositório não existe no GitHub"
        echo "2. Problemas de autenticação"
        echo "3. Repositório não está vazio"
        echo ""
        echo "Soluções:"
        echo "1. Crie o repositório no GitHub: $REPO_URL"
        echo "2. Configure autenticação: git config --global user.name 'Seu Nome'"
        echo "3. Configure token: git remote set-url origin https://SEU_TOKEN@github.com/dev-catena/gateway-lacos-.git"
        echo ""
        echo "Ou force o push (cuidado!):"
        echo "   git push -u origin main --force"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📦 Repositório:${NC} $REPO_URL"
echo -e "${BLUE}📁 Branch:${NC} main"
echo ""
echo "Para verificar, acesse:"
echo "  $REPO_URL"
echo ""

# Voltar para o diretório original
cd "$CURRENT_DIR"







