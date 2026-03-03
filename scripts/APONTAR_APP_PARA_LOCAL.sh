#!/bin/bash

# Script para apontar o app para o backend local

set -e

PROJECT_DIR="/home/darley/lacos"
API_CONFIG_FILE="$PROJECT_DIR/src/config/api.js"
LOCAL_API_URL="http://localhost:8000/api"

echo "=========================================="
echo "🔧 CONFIGURANDO APP PARA BACKEND LOCAL"
echo "=========================================="
echo ""

# Verificar se arquivo existe
if [ ! -f "$API_CONFIG_FILE" ]; then
    echo "❌ Arquivo de configuração não encontrado: $API_CONFIG_FILE"
    exit 1
fi

# Fazer backup
BACKUP_FILE="${API_CONFIG_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$API_CONFIG_FILE" "$BACKUP_FILE"
echo "💾 Backup criado: $BACKUP_FILE"
echo ""

# Ler URL atual
CURRENT_URL=$(grep -o "BASE_URL: '[^']*'" "$API_CONFIG_FILE" | cut -d"'" -f2)
echo "📊 URL atual: $CURRENT_URL"
echo "🎯 Nova URL:  $LOCAL_API_URL"
echo ""

# Substituir URL
sed -i "s|BASE_URL: '.*'|BASE_URL: '$LOCAL_API_URL'|g" "$API_CONFIG_FILE"

# Verificar se foi alterado
NEW_URL=$(grep -o "BASE_URL: '[^']*'" "$API_CONFIG_FILE" | cut -d"'" -f2)
if [ "$NEW_URL" = "$LOCAL_API_URL" ]; then
    echo "✅ Configuração atualizada com sucesso!"
    echo ""
    echo "📝 Nova configuração:"
    grep "BASE_URL" "$API_CONFIG_FILE"
else
    echo "❌ Erro ao atualizar configuração"
    echo "   Restaurando backup..."
    cp "$BACKUP_FILE" "$API_CONFIG_FILE"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ CONFIGURAÇÃO CONCLUÍDA!"
echo "=========================================="
echo ""
echo "📋 Próximos passos:"
echo "   1. Iniciar o servidor Laravel local:"
echo "      cd backend-laravel"
echo "      php artisan serve"
echo ""
echo "   2. Verificar se está rodando:"
echo "      curl http://localhost:8000/api/gateway/status"
echo ""
echo "   3. Reiniciar o app React Native"
echo ""
echo "💡 Para voltar ao servidor remoto:"
echo "   Restaure o backup: cp $BACKUP_FILE $API_CONFIG_FILE"












