#!/bin/bash

# Script para atualizar o backend Laravel local

set -e

BACKEND_DIR="/home/darley/lacos/backend-laravel"

echo "=========================================="
echo "🔄 ATUALIZANDO BACKEND LARAVEL LOCAL"
echo "=========================================="
echo ""

if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Diretório do backend não encontrado: $BACKEND_DIR"
    exit 1
fi

cd "$BACKEND_DIR"

echo "📁 Diretório: $BACKEND_DIR"
echo ""

# Verificar se é repositório Git
if [ ! -d ".git" ]; then
    echo "❌ Não é um repositório Git!"
    exit 1
fi

# Verificar branch atual
CURRENT_BRANCH=$(git branch --show-current)
echo "🌿 Branch atual: $CURRENT_BRANCH"
echo ""

# Verificar status antes
echo "📊 Status antes da atualização:"
git status --short | head -10 || echo "   Nenhuma mudança pendente"
echo ""

# Fazer stash de mudanças locais se houver
HAS_CHANGES=$(git status --porcelain | wc -l)
if [ "$HAS_CHANGES" -gt 0 ]; then
    echo "💾 Salvando mudanças locais em stash..."
    git stash push -m "Backup antes de atualizar - $(date +%Y%m%d_%H%M%S)"
    echo "✅ Mudanças salvas"
    echo ""
fi

# Fazer fetch
echo "📥 Fazendo fetch do repositório remoto..."
git fetch origin

# Verificar se há atualizações
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/$CURRENT_BRANCH)

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "✅ Backend já está atualizado!"
    echo "   Commit: $(git log -1 --oneline)"
else
    echo "🔄 Atualizações encontradas!"
    echo "   Local:  $(git log -1 --oneline)"
    echo "   Remoto: $(git log -1 --oneline origin/$CURRENT_BRANCH)"
    echo ""
    
    echo "📥 Fazendo pull..."
    git pull origin $CURRENT_BRANCH
    
    echo "✅ Backend atualizado!"
fi

echo ""
echo "📊 Status após atualização:"
git status --short | head -10 || echo "   Repositório limpo"
echo ""

echo "📝 Último commit:"
git log -1 --oneline
echo ""

if [ "$HAS_CHANGES" -gt 0 ]; then
    echo "📋 Mudanças locais salvas em stash:"
    echo "   Para restaurar: git stash pop"
    echo ""
fi

echo "=========================================="
echo "✅ ATUALIZAÇÃO CONCLUÍDA!"
echo "=========================================="












