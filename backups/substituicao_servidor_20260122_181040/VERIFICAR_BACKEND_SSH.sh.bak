#!/bin/bash

# Script para verificar backend via SSH (porta 63022)

set -e

echo "🔍 VERIFICANDO BACKEND VIA SSH"
echo "==============================="
echo ""

SERVER_USER="darley"
SERVER_HOST="193.203.182.22"
SERVER_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

echo "📡 Servidor: $SERVER_USER@$SERVER_HOST:$SERVER_PORT"
echo "📂 Backend: $BACKEND_PATH"
echo ""

# Verificar se sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    echo "⚠️  sshpass não está instalado"
    echo "   Instalando..."
    sudo apt-get update && sudo apt-get install -y sshpass 2>/dev/null || {
        echo "❌ Não foi possível instalar sshpass"
        echo "   Execute manualmente: sudo apt install sshpass"
        exit 1
    }
fi

# Pedir senha
read -sp "🔐 Senha SSH: " SERVER_PASS
echo ""
echo ""

# 1. Verificar se backend existe
echo "1️⃣ Verificando se backend existe..."
BACKEND_EXISTS=$(sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -p "$SERVER_PORT" \
    "${SERVER_USER}@${SERVER_HOST}" \
    "test -d $BACKEND_PATH && echo 'SIM' || echo 'NAO'" 2>/dev/null || echo "ERRO")

if [ "$BACKEND_EXISTS" = "SIM" ]; then
    echo "✅ Backend existe"
else
    echo "❌ Backend NÃO existe em $BACKEND_PATH"
    exit 1
fi
echo ""

# 2. Verificar se Laravel está rodando
echo "2️⃣ Verificando se Laravel está configurado..."
HAS_ARTISAN=$(sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -p "$SERVER_PORT" \
    "${SERVER_USER}@${SERVER_HOST}" \
    "test -f $BACKEND_PATH/artisan && echo 'SIM' || echo 'NAO'" 2>/dev/null || echo "ERRO")

if [ "$HAS_ARTISAN" = "SIM" ]; then
    echo "✅ Laravel está configurado"
else
    echo "❌ Laravel não está configurado"
fi
echo ""

# 3. Verificar se nginx/apache está rodando
echo "3️⃣ Verificando servidor web..."
WEB_SERVER=$(sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -p "$SERVER_PORT" \
    "${SERVER_USER}@${SERVER_HOST}" \
    "systemctl is-active nginx 2>/dev/null || systemctl is-active apache2 2>/dev/null || echo 'INATIVO'" 2>/dev/null || echo "ERRO")

if [ "$WEB_SERVER" != "INATIVO" ] && [ "$WEB_SERVER" != "ERRO" ]; then
    echo "✅ Servidor web está rodando: $WEB_SERVER"
else
    echo "⚠️  Servidor web pode não estar rodando"
fi
echo ""

# 4. Verificar CORS
echo "4️⃣ Verificando configuração CORS..."
CORS_FILE=$(sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -p "$SERVER_PORT" \
    "${SERVER_USER}@${SERVER_HOST}" \
    "test -f $BACKEND_PATH/config/cors.php && echo 'SIM' || echo 'NAO'" 2>/dev/null || echo "ERRO")

if [ "$CORS_FILE" = "SIM" ]; then
    echo "✅ config/cors.php existe"
    
    # Verificar se tem localhost nas origens permitidas
    HAS_LOCALHOST=$(sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -p "$SERVER_PORT" \
        "${SERVER_USER}@${SERVER_HOST}" \
        "grep -q 'localhost:8081\|localhost:19006' $BACKEND_PATH/config/cors.php && echo 'SIM' || echo 'NAO'" 2>/dev/null || echo "NAO")
    
    if [ "$HAS_LOCALHOST" = "SIM" ]; then
        echo "✅ CORS já permite localhost:8081"
    else
        echo "⚠️  CORS NÃO permite localhost:8081"
        echo "   Precisa adicionar ao config/cors.php"
    fi
else
    echo "❌ config/cors.php NÃO existe"
    echo "   Precisa criar configuração CORS"
fi
echo ""

# 5. Testar endpoint localmente no servidor
echo "5️⃣ Testando endpoint no servidor..."
ENDPOINT_TEST=$(sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -p "$SERVER_PORT" \
    "${SERVER_USER}@${SERVER_HOST}" \
    "curl -s --connect-timeout 5 http://localhost/api 2>&1 | head -3" 2>/dev/null || echo "ERRO")

if [ "$ENDPOINT_TEST" != "ERRO" ] && [ -n "$ENDPOINT_TEST" ]; then
    echo "✅ Endpoint responde localmente no servidor"
    echo "   Resposta: $(echo "$ENDPOINT_TEST" | head -1)"
else
    echo "❌ Endpoint NÃO responde localmente no servidor"
    echo "   Backend pode não estar rodando ou configurado"
fi
echo ""

# 6. Verificar firewall
echo "6️⃣ Verificando firewall..."
FIREWALL_STATUS=$(sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -p "$SERVER_PORT" \
    "${SERVER_USER}@${SERVER_HOST}" \
    "sudo ufw status 2>/dev/null | head -1 || echo 'INATIVO'" 2>/dev/null || echo "ERRO")

if echo "$FIREWALL_STATUS" | grep -q "Status: active"; then
    echo "⚠️  Firewall está ATIVO"
    echo "   Verificando regras para porta 80..."
    
    HAS_PORT80=$(sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -p "$SERVER_PORT" \
        "${SERVER_USER}@${SERVER_HOST}" \
        "sudo ufw status | grep -q '80/tcp' && echo 'SIM' || echo 'NAO'" 2>/dev/null || echo "NAO")
    
    if [ "$HAS_PORT80" = "SIM" ]; then
        echo "✅ Porta 80 está permitida"
    else
        echo "❌ Porta 80 NÃO está permitida no firewall"
        echo "   Execute: sudo ufw allow 80/tcp"
    fi
else
    echo "✅ Firewall está inativo ou não configurado"
fi
echo ""

# Resumo
echo "═══════════════════════════════════════════════════════════"
echo "📋 RESUMO"
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ "$ENDPOINT_TEST" = "ERRO" ] || [ -z "$ENDPOINT_TEST" ]; then
    echo "❌ PROBLEMA: Backend não está respondendo"
    echo ""
    echo "💡 SOLUÇÕES:"
    echo ""
    echo "1. Verificar se nginx/apache está rodando:"
    echo "   ssh -p 63022 $SERVER_USER@$SERVER_HOST"
    echo "   sudo systemctl status nginx"
    echo "   sudo systemctl start nginx"
    echo ""
    echo "2. Verificar se Laravel está configurado:"
    echo "   cd $BACKEND_PATH"
    echo "   php artisan route:list"
    echo ""
    echo "3. Verificar logs:"
    echo "   tail -f $BACKEND_PATH/storage/logs/laravel.log"
    echo ""
elif [ "$HAS_LOCALHOST" = "NAO" ]; then
    echo "⚠️  PROBLEMA: CORS não permite localhost:8081"
    echo ""
    echo "💡 SOLUÇÃO: Configurar CORS"
    echo ""
    echo "Execute:"
    echo "   ./CONFIGURAR_CORS_BACKEND.sh"
    echo ""
else
    echo "✅ Backend parece estar configurado!"
    echo ""
    echo "💡 Se ainda tiver problemas:"
    echo "   1. Verificar firewall (porta 80)"
    echo "   2. Verificar nginx/apache"
    echo "   3. Verificar logs do Laravel"
    echo ""
fi

echo "═══════════════════════════════════════════════════════════"
echo ""

