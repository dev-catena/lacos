#!/bin/bash

# Script para sincronizar backend com GitHub exatamente
# Mantém apenas o .env local

set -e

BACKEND_DIR="/home/darley/lacos/backend-laravel"
ENV_LOCAL="$BACKEND_DIR/.env"

echo "=========================================="
echo "🔄 SINCRONIZANDO BACKEND COM GITHUB"
echo "=========================================="
echo ""
echo "📋 O projeto será exatamente igual ao GitHub"
echo "📋 Apenas o .env será mantido localmente"
echo ""

cd "$BACKEND_DIR"

# Verificar se é repositório Git
if [ ! -d ".git" ]; then
    echo "❌ Não é um repositório Git!"
    exit 1
fi

# Fazer backup do .env
if [ -f "$ENV_LOCAL" ]; then
    ENV_BACKUP="${ENV_LOCAL}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "💾 Fazendo backup do .env..."
    cp "$ENV_LOCAL" "$ENV_BACKUP"
    echo "   Backup salvo em: $ENV_BACKUP"
else
    echo "⚠️  .env não encontrado - será criado depois"
fi

echo ""
echo "📥 Buscando atualizações do GitHub..."
git fetch origin

echo ""
echo "📊 Verificando diferenças..."
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/main)

if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
    echo "✅ Já está atualizado com o GitHub"
else
    echo "🔄 Atualizações encontradas!"
    echo "   Local:  $(git log -1 --oneline HEAD)"
    echo "   Remoto: $(git log -1 --oneline origin/main)"
    echo ""
fi

echo ""
echo "🔄 Fazendo reset para ficar igual ao GitHub..."
echo "   (Isso vai descartar mudanças locais não commitadas)"

# Salvar mudanças locais em stash
HAS_CHANGES=$(git status --porcelain | wc -l)
if [ "$HAS_CHANGES" -gt 0 ]; then
    echo "💾 Salvando mudanças locais em stash..."
    git stash push -m "Backup antes de sincronizar com GitHub - $(date +%Y%m%d_%H%M%S)"
fi

# Resetar para origin/main
git reset --hard origin/main

# Limpar arquivos não rastreados
git clean -fd

echo "✅ Projeto sincronizado com GitHub!"

echo ""
echo "📋 Restaurando .env local..."
if [ -f "$ENV_BACKUP" ]; then
    cp "$ENV_BACKUP" "$ENV_LOCAL"
    echo "✅ .env restaurado"
elif [ -f "$ENV_LOCAL" ]; then
    echo "✅ .env já existe"
else
    echo "⚠️  .env não encontrado"
    if [ -f ".env.example" ]; then
        echo "📋 Criando .env do exemplo..."
        cp .env.example .env
        php artisan key:generate 2>/dev/null || echo "   (artisan não disponível)"
    fi
fi

echo ""
echo "📊 Status final:"
git status --short | head -10 || echo "   Repositório limpo e sincronizado"

echo ""
echo "📝 Último commit:"
git log -1 --oneline

echo ""
echo "=========================================="
echo "✅ SINCRONIZAÇÃO CONCLUÍDA!"
echo "=========================================="
echo ""
echo "📋 Resumo:"
echo "   ✅ Projeto igual ao GitHub"
echo "   ✅ .env mantido localmente"
if [ "$HAS_CHANGES" -gt 0 ]; then
    echo "   💾 Mudanças locais salvas em stash"
    echo "      Para ver: git stash list"
    echo "      Para restaurar: git stash pop"
fi
echo ""
echo "🚀 Para iniciar servidor (se tiver artisan):"
echo "   cd $BACKEND_DIR"
echo "   php artisan serve --host 0.0.0.0 --port 8000"
echo ""












