#!/bin/bash

# Script para restaurar .env do backup

set -e

BACKUP_ENV="/home/darley/lacos/.env_COMPLETO_SERVIDOR"
BACKEND_DIR="/home/darley/lacos/backend-laravel"
TARGET_ENV="$BACKEND_DIR/.env"

echo "=========================================="
echo "📦 RESTAURANDO .ENV DO BACKUP"
echo "=========================================="
echo ""

# Verificar se arquivo de backup existe
if [ ! -f "$BACKUP_ENV" ]; then
    echo "❌ Arquivo de backup não encontrado: $BACKUP_ENV"
    exit 1
fi

# Verificar se diretório do backend existe
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Diretório do backend não encontrado: $BACKEND_DIR"
    exit 1
fi

# Fazer backup do .env atual se existir
if [ -f "$TARGET_ENV" ]; then
    BACKUP_CURRENT="${TARGET_ENV}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "💾 Fazendo backup do .env atual..."
    cp "$TARGET_ENV" "$BACKUP_CURRENT"
    echo "   Backup salvo em: $BACKUP_CURRENT"
    echo ""
fi

# Copiar .env do backup
echo "📦 Restaurando .env do backup..."
cp "$BACKUP_ENV" "$TARGET_ENV"

if [ $? -eq 0 ]; then
    echo "✅ .env restaurado com sucesso!"
    echo ""
    echo "📝 Arquivo: $TARGET_ENV"
    echo "📊 Tamanho: $(du -h "$TARGET_ENV" | cut -f1)"
    echo ""
    echo "⚠️  IMPORTANTE: Ajuste as configurações para ambiente local:"
    echo "   - APP_ENV=local"
    echo "   - APP_DEBUG=true"
    echo "   - APP_URL=http://localhost:8000"
    echo "   - DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD (se necessário)"
    echo ""
    echo "💡 Para editar:"
    echo "   nano $TARGET_ENV"
else
    echo "❌ Erro ao restaurar .env"
    exit 1
fi

echo "=========================================="
echo "✅ RESTAURAÇÃO CONCLUÍDA!"
echo "=========================================="





