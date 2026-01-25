#!/bin/bash

# Script para adicionar variáveis de ambiente no .env do backend

BACKEND_DIR="/home/darley/lacos/backend-laravel"
ENV_FILE="$BACKEND_DIR/.env"

echo "🔧 Adicionando variáveis de ambiente no .env do backend..."
echo ""

if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️  Arquivo .env não encontrado em $ENV_FILE"
    echo "   Criando arquivo .env..."
    touch "$ENV_FILE"
fi

# Verificar se as variáveis já existem
if grep -q "^APP_HOST=" "$ENV_FILE"; then
    echo "📝 Atualizando APP_HOST..."
    sed -i "s|^APP_HOST=.*|APP_HOST=10.102.0.103|" "$ENV_FILE"
else
    echo "➕ Adicionando APP_HOST..."
    echo "" >> "$ENV_FILE"
    echo "# Backend Host Configuration" >> "$ENV_FILE"
    echo "APP_HOST=10.102.0.103" >> "$ENV_FILE"
fi

if grep -q "^APP_PORT=" "$ENV_FILE"; then
    echo "📝 Atualizando APP_PORT..."
    sed -i "s|^APP_PORT=.*|APP_PORT=8000|" "$ENV_FILE"
else
    echo "➕ Adicionando APP_PORT..."
    echo "APP_PORT=8000" >> "$ENV_FILE"
fi

# Atualizar APP_URL se necessário
if grep -q "^APP_URL=" "$ENV_FILE"; then
    echo "📝 Atualizando APP_URL para usar APP_HOST e APP_PORT..."
    sed -i "s|^APP_URL=.*|APP_URL=http://\${APP_HOST}:\${APP_PORT}|" "$ENV_FILE"
else
    echo "➕ Adicionando APP_URL..."
    echo "APP_URL=http://\${APP_HOST}:\${APP_PORT}" >> "$ENV_FILE"
fi

echo ""
echo "✅ Variáveis de ambiente adicionadas/atualizadas!"
echo ""
echo "📋 Variáveis configuradas:"
grep -E "^APP_HOST=|^APP_PORT=|^APP_URL=" "$ENV_FILE" | head -3
echo ""
echo "💡 Para alterar o IP do servidor, edite APP_HOST no arquivo .env"



