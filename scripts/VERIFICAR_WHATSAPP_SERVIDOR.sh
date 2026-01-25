#!/bin/bash

# Script para verificar configuração do WhatsApp no servidor
SERVER="10.102.0.103"
PORT="63022"
USER="darley"
PASSWORD="yhvh77"
REMOTE_PATH="/var/www/lacos-backend"

echo "🔍 Verificando configuração do WhatsApp..."
echo ""

# Verificar variáveis de ambiente
echo "1️⃣ Verificando variáveis de ambiente (.env)..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" << 'REMOTE'
cd /var/www/lacos-backend
echo "WHATSAPP_API_URL: $(grep WHATSAPP_API_URL .env 2>/dev/null || echo '❌ Não encontrado')"
echo "WHATSAPP_API_KEY: $(grep WHATSAPP_API_KEY .env 2>/dev/null | sed 's/=.*/=***/' || echo '❌ Não encontrado')"
echo "WHATSAPP_INSTANCE_NAME: $(grep WHATSAPP_INSTANCE_NAME .env 2>/dev/null || echo '❌ Não encontrado')"
REMOTE

echo ""
echo "2️⃣ Verificando se Evolution API está rodando..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" << 'REMOTE'
if docker ps | grep -q evolution; then
    echo "✅ Evolution API está rodando"
    docker ps | grep evolution
else
    echo "❌ Evolution API NÃO está rodando"
    echo "   Containers Docker:"
    docker ps
fi
REMOTE

echo ""
echo "3️⃣ Verificando logs recentes de WhatsApp..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" << 'REMOTE'
cd /var/www/lacos-backend
echo "Últimas 30 linhas de logs relacionados a WhatsApp:"
tail -50 storage/logs/laravel.log | grep -i "whatsapp\|2fa\|sendMessage\|sendVerificationCode" | tail -20 || echo "Nenhum log encontrado"
REMOTE

echo ""
echo "4️⃣ Testando conexão com Evolution API..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" << 'REMOTE'
cd /var/www/lacos-backend
WHATSAPP_URL=$(grep WHATSAPP_API_URL .env 2>/dev/null | cut -d '=' -f2 | tr -d '"' | tr -d "'" || echo "http://localhost:8080")
WHATSAPP_KEY=$(grep WHATSAPP_API_KEY .env 2>/dev/null | cut -d '=' -f2 | tr -d '"' | tr -d "'" || echo "")

if [ -z "$WHATSAPP_KEY" ]; then
    echo "❌ WHATSAPP_API_KEY não configurado"
else
    echo "Testando: $WHATSAPP_URL/instance/fetchInstances"
    curl -s -H "apikey: $WHATSAPP_KEY" "$WHATSAPP_URL/instance/fetchInstances" | head -20 || echo "❌ Erro ao conectar com Evolution API"
fi
REMOTE

echo ""
echo "✅ Verificação concluída!"

