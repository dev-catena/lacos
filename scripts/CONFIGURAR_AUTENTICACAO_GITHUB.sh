#!/bin/bash

##############################################
# Script para configurar autenticação GitHub
# e fazer push do código
##############################################

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

REPO_URL="https://github.com/dev-catena/gateway-lacos-.git"

echo -e "${BLUE}🔐 Configurar Autenticação GitHub${NC}"
echo "=========================================="
echo ""

# Verificar se estamos no diretório correto
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Erro: Não é um repositório git!${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  O Git está usando credenciais de outro usuário (devRoboflex)${NC}"
echo ""
echo "Opções de autenticação:"
echo ""
echo "1. Token de Acesso Pessoal (PAT) - Recomendado"
echo "2. SSH Key"
echo "3. Remover credenciais antigas e tentar novamente"
echo ""
read -p "Escolha uma opção (1/2/3): " opcao

case $opcao in
    1)
        echo ""
        echo -e "${BLUE}📝 Configurando com Token de Acesso Pessoal${NC}"
        echo ""
        echo "Para criar um token:"
        echo "1. Acesse: https://github.com/settings/tokens"
        echo "2. Clique em 'Generate new token (classic)'"
        echo "3. Dê um nome (ex: gateway-lacos-deploy)"
        echo "4. Selecione escopo: 'repo' (acesso completo aos repositórios)"
        echo "5. Clique em 'Generate token'"
        echo "6. COPIE o token (você não verá novamente!)"
        echo ""
        read -p "Cole seu token aqui: " token
        
        if [ -z "$token" ]; then
            echo -e "${RED}❌ Token não fornecido!${NC}"
            exit 1
        fi
        
        # Configurar remote com token
        git remote set-url origin "https://${token}@github.com/dev-catena/gateway-lacos-.git"
        echo -e "${GREEN}✓${NC} Remote configurado com token"
        echo ""
        echo -e "${YELLOW}⚠️  Nota: O token será visível no histórico do Git${NC}"
        echo "Para maior segurança, considere usar SSH key (opção 2)"
        ;;
        
    2)
        echo ""
        echo -e "${BLUE}📝 Configurando com SSH Key${NC}"
        echo ""
        echo "Verificando se já existe SSH key..."
        
        if [ -f ~/.ssh/id_rsa.pub ] || [ -f ~/.ssh/id_ed25519.pub ]; then
            echo -e "${GREEN}✓${NC} SSH key encontrada"
            if [ -f ~/.ssh/id_ed25519.pub ]; then
                echo ""
                echo "Sua chave pública SSH (id_ed25519):"
                cat ~/.ssh/id_ed25519.pub
            else
                echo ""
                echo "Sua chave pública SSH (id_rsa):"
                cat ~/.ssh/id_rsa.pub
            fi
            echo ""
            echo "Se esta chave não estiver adicionada ao GitHub:"
            echo "1. Acesse: https://github.com/settings/keys"
            echo "2. Clique em 'New SSH key'"
            echo "3. Cole a chave acima"
            echo ""
            read -p "Pressione Enter quando a chave estiver adicionada ao GitHub..."
            
            # Configurar remote com SSH
            git remote set-url origin "git@github.com:dev-catena/gateway-lacos-.git"
            echo -e "${GREEN}✓${NC} Remote configurado com SSH"
        else
            echo -e "${YELLOW}⚠️  Nenhuma SSH key encontrada${NC}"
            echo ""
            read -p "Deseja criar uma nova SSH key? (s/N): " criar
            if [[ $criar =~ ^[Ss]$ ]]; then
                ssh-keygen -t ed25519 -C "coroneldarley@gmail.com"
                echo ""
                echo "Sua chave pública SSH:"
                cat ~/.ssh/id_ed25519.pub
                echo ""
                echo "Adicione esta chave ao GitHub:"
                echo "1. Acesse: https://github.com/settings/keys"
                echo "2. Clique em 'New SSH key'"
                echo "3. Cole a chave acima"
                echo ""
                read -p "Pressione Enter quando a chave estiver adicionada ao GitHub..."
                
                # Configurar remote com SSH
                git remote set-url origin "git@github.com:dev-catena/gateway-lacos-.git"
                echo -e "${GREEN}✓${NC} Remote configurado com SSH"
            else
                echo "Usando método de token então..."
                read -p "Cole seu token GitHub: " token
                if [ -z "$token" ]; then
                    echo -e "${RED}❌ Token não fornecido!${NC}"
                    exit 1
                fi
                git remote set-url origin "https://${token}@github.com/dev-catena/gateway-lacos-.git"
            fi
        fi
        ;;
        
    3)
        echo ""
        echo -e "${BLUE}🧹 Removendo credenciais antigas${NC}"
        
        # Remover credenciais do helper
        if [ -f ~/.git-credentials ]; then
            echo "Removendo ~/.git-credentials"
            rm ~/.git-credentials
        fi
        
        # Limpar cache de credenciais
        git credential-cache exit 2>/dev/null || true
        
        echo -e "${GREEN}✓${NC} Credenciais antigas removidas"
        echo ""
        echo "Agora você precisará fornecer credenciais quando fizer push"
        echo "Use opção 1 (Token) ou 2 (SSH) para configurar autenticação"
        exit 0
        ;;
        
    *)
        echo -e "${RED}❌ Opção inválida!${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}🚀 Tentando fazer push...${NC}"
echo ""

# Verificar branch atual
BRANCH=$(git branch --show-current)
echo "Branch atual: $BRANCH"

# Fazer push
if git push -u origin "$BRANCH" 2>&1; then
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ Push concluído com sucesso!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}📦 Repositório:${NC} $REPO_URL"
    echo -e "${BLUE}📁 Branch:${NC} $BRANCH"
    echo ""
    echo "Para verificar, acesse:"
    echo "  $REPO_URL"
else
    echo ""
    echo -e "${RED}❌ Erro ao fazer push${NC}"
    echo ""
    echo "Possíveis causas:"
    echo "1. Token/SSH key inválido ou sem permissões"
    echo "2. Repositório não existe ou você não tem acesso"
    echo "3. Repositório remoto não está vazio"
    echo ""
    echo "Soluções:"
    echo "1. Verifique se o repositório existe: $REPO_URL"
    echo "2. Verifique suas permissões no repositório"
    echo "3. Se o repositório não está vazio, use: git push -u origin $BRANCH --force"
    echo "   (⚠️  Cuidado: isso sobrescreverá o conteúdo remoto!)"
fi










