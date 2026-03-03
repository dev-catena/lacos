#!/bin/bash

# Script para fazer backup do projeto e depois fazer git pull sobrescrevendo tudo

set -e

PROJECT_DIR="/home/darley/lacos"
BACKUP_DIR="/home/darley/lacos_backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/lacos_backup_${TIMESTAMP}"

echo "=========================================="
echo "💾 BACKUP E GIT PULL"
echo "=========================================="
echo ""

# Verificar se estamos no diretório correto
if [ ! -d "$PROJECT_DIR/.git" ]; then
    echo "❌ Diretório não é um repositório Git: $PROJECT_DIR"
    exit 1
fi

echo "📁 Diretório do projeto: $PROJECT_DIR"
echo "📦 Diretório de backup: $BACKUP_DIR"
echo ""

# Criar diretório de backups se não existir
mkdir -p "$BACKUP_DIR"
echo "✅ Diretório de backups criado/verificado"
echo ""

# Verificar status do Git antes
echo "📊 Status atual do Git:"
cd "$PROJECT_DIR"
git status --short | head -10 || echo "   Nenhuma mudança pendente"
echo ""

# Verificar branch atual
CURRENT_BRANCH=$(git branch --show-current)
echo "🌿 Branch atual: $CURRENT_BRANCH"
echo ""

# Fazer backup
echo "💾 1. Fazendo backup do projeto..."
echo "   Backup será salvo em: $BACKUP_PATH"
echo ""

# Criar backup usando tar (mais rápido e eficiente)
tar -czf "${BACKUP_PATH}.tar.gz" \
    -C "$(dirname $PROJECT_DIR)" \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='vendor' \
    --exclude='storage/logs/*' \
    --exclude='storage/framework/cache/*' \
    --exclude='storage/framework/sessions/*' \
    --exclude='storage/framework/views/*' \
    --exclude='.next' \
    --exclude='dist' \
    --exclude='build' \
    "$(basename $PROJECT_DIR)" 2>/dev/null

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_PATH}.tar.gz" | cut -f1)
    echo "✅ Backup criado com sucesso!"
    echo "   Tamanho: $BACKUP_SIZE"
    echo "   Local: ${BACKUP_PATH}.tar.gz"
else
    echo "❌ Erro ao criar backup"
    exit 1
fi

echo ""
echo "🔄 2. Fazendo git pull (sobrescrevendo tudo localmente)..."
echo ""

# Salvar mudanças locais não commitadas (se houver)
echo "   Verificando mudanças locais..."
HAS_CHANGES=$(git status --porcelain | wc -l)
if [ "$HAS_CHANGES" -gt 0 ]; then
    echo "   ⚠️  Há mudanças locais não commitadas"
    echo "   💾 Salvando em stash..."
    git stash push -m "Backup antes de git pull - $(date +%Y%m%d_%H%M%S)"
    echo "   ✅ Mudanças salvas em stash"
fi

echo ""
echo "   📥 Fazendo fetch..."
git fetch origin

echo ""
echo "   🔄 Fazendo reset hard para sobrescrever tudo..."
git reset --hard origin/$CURRENT_BRANCH

echo ""
echo "   🧹 Limpando arquivos não rastreados..."
git clean -fd

echo ""
echo "✅ Git pull concluído!"
echo ""

# Verificar status final
echo "📊 Status final do Git:"
git status --short | head -10 || echo "   Repositório limpo"
echo ""

# Mostrar último commit
echo "📝 Último commit:"
git log -1 --oneline
echo ""

# Informações sobre o backup
echo "=========================================="
echo "✅ PROCESSO CONCLUÍDO!"
echo "=========================================="
echo ""
echo "💾 Backup salvo em:"
echo "   ${BACKUP_PATH}.tar.gz"
echo ""
echo "📦 Para restaurar o backup:"
echo "   cd /home/darley"
echo "   tar -xzf ${BACKUP_PATH}.tar.gz"
echo ""
echo "📋 Stash salvo (se houver mudanças locais):"
if [ "$HAS_CHANGES" -gt 0 ]; then
    echo "   git stash list"
    echo "   git stash pop  # Para restaurar mudanças"
else
    echo "   Nenhuma mudança local foi salva"
fi
echo ""
echo "🌿 Branch: $CURRENT_BRANCH"
echo "📝 Último commit: $(git log -1 --oneline)"
echo ""












