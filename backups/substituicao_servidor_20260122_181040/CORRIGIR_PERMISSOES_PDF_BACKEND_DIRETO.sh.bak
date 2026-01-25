#!/bin/bash

# Script para corrigir permissões do diretório de PDFs no backend
# Versão para executar DIRETAMENTE no servidor (sem SSH)

set -e

echo "🔧 CORRIGINDO PERMISSÕES DO BACKEND PARA PDFs"
echo "=============================================="
echo ""

# Configurações
BACKEND_PATH="/var/www/lacos-backend"
TEMP_DIR="${BACKEND_PATH}/storage/app/temp"
STORAGE_DIR="${BACKEND_PATH}/storage"

echo "📋 Configurações:"
echo "   Backend: ${BACKEND_PATH}"
echo "   Diretório Temp: ${TEMP_DIR}"
echo "   Diretório Storage: ${STORAGE_DIR}"
echo ""

echo "1️⃣ Verificando diretórios..."

# Verificar se o backend existe
if [ ! -d "$BACKEND_PATH" ]; then
    echo "   ❌ Diretório do backend não encontrado: ${BACKEND_PATH}"
    exit 1
fi
echo "   ✅ Backend encontrado"

# Criar diretório temp se não existir
if [ ! -d "$TEMP_DIR" ]; then
    echo "   ⚠️  Diretório temp não existe, criando..."
    mkdir -p "$TEMP_DIR"
    echo "   ✅ Diretório criado"
else
    echo "   ✅ Diretório temp existe"
fi

# Verificar diretório storage
if [ ! -d "$STORAGE_DIR" ]; then
    echo "   ⚠️  Diretório storage não existe, criando..."
    mkdir -p "$STORAGE_DIR"
    echo "   ✅ Diretório storage criado"
else
    echo "   ✅ Diretório storage existe"
fi

echo ""
echo "2️⃣ Verificando permissões atuais..."
echo "   Storage:"
ls -ld "$STORAGE_DIR" 2>/dev/null || echo "   ⚠️  Não foi possível verificar"
echo "   Temp:"
ls -ld "$TEMP_DIR" 2>/dev/null || echo "   ⚠️  Não foi possível verificar"
echo ""

# Verificar se o usuário www-data existe
if id "www-data" &>/dev/null; then
    echo "3️⃣ Usuário www-data encontrado"
    WEB_USER="www-data"
    WEB_GROUP="www-data"
else
    echo "   ⚠️  Usuário www-data não encontrado"
    # Tentar identificar o usuário do web server
    if id "apache" &>/dev/null; then
        echo "   ✅ Usando usuário apache"
        WEB_USER="apache"
        WEB_GROUP="apache"
    elif id "nginx" &>/dev/null; then
        echo "   ✅ Usando usuário nginx"
        WEB_USER="nginx"
        WEB_GROUP="nginx"
    else
        echo "   ⚠️  Usando usuário atual: $(whoami)"
        WEB_USER=$(whoami)
        WEB_GROUP=$(whoami)
    fi
fi
echo ""

# Corrigir permissões do storage
echo "4️⃣ Corrigindo permissões do storage..."
chown -R ${WEB_USER}:${WEB_GROUP} "$STORAGE_DIR"
chmod -R 775 "$STORAGE_DIR"
echo "   ✅ Permissões do storage corrigidas (${WEB_USER}:${WEB_GROUP}, 775)"

# Corrigir permissões específicas do temp
echo ""
echo "5️⃣ Corrigindo permissões do diretório temp..."
chown -R ${WEB_USER}:${WEB_GROUP} "$TEMP_DIR"
chmod -R 775 "$TEMP_DIR"
echo "   ✅ Permissões do temp corrigidas (${WEB_USER}:${WEB_GROUP}, 775)"

# Verificar se o diretório está acessível
echo ""
echo "6️⃣ Testando escrita no diretório..."
TEST_FILE="${TEMP_DIR}/test_write_$(date +%s).txt"
if touch "$TEST_FILE" 2>/dev/null; then
    echo "   ✅ Escrita funcionando"
    rm -f "$TEST_FILE"
else
    echo "   ⚠️  Erro ao escrever no diretório como usuário atual"
    echo "   Tentando com permissões mais permissivas..."
    chmod 777 "$TEMP_DIR"
    if touch "$TEST_FILE" 2>/dev/null; then
        echo "   ✅ Escrita funcionando com 777"
        rm -f "$TEST_FILE"
    else
        echo "   ❌ Ainda não foi possível escrever"
    fi
fi

echo ""
echo "7️⃣ Verificando configuração do Laravel..."
if [ -f "${BACKEND_PATH}/.env" ]; then
    echo "   ✅ Arquivo .env encontrado"
    # Verificar se APP_ENV está configurado
    if grep -q "APP_ENV" "${BACKEND_PATH}/.env"; then
        APP_ENV=$(grep "APP_ENV" "${BACKEND_PATH}/.env" | cut -d '=' -f2 | tr -d ' ')
        echo "   ✅ APP_ENV=${APP_ENV}"
    else
        echo "   ⚠️  APP_ENV não encontrado no .env"
    fi
else
    echo "   ⚠️  Arquivo .env não encontrado"
fi

# Verificar se o diretório de logs existe e tem permissões corretas
LOG_DIR="${STORAGE_DIR}/logs"
if [ -d "$LOG_DIR" ]; then
    echo ""
    echo "8️⃣ Corrigindo permissões do diretório de logs..."
    chown -R ${WEB_USER}:${WEB_GROUP} "$LOG_DIR"
    chmod -R 775 "$LOG_DIR"
    echo "   ✅ Permissões dos logs corrigidas"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ CORREÇÃO CONCLUÍDA"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 Resumo:"
echo "   ✅ Diretório temp verificado/criado: ${TEMP_DIR}"
echo "   ✅ Permissões do storage corrigidas (${WEB_USER}:${WEB_GROUP}, 775)"
echo "   ✅ Permissões do temp corrigidas (${WEB_USER}:${WEB_GROUP}, 775)"
echo ""
echo "💡 Próximos passos:"
echo "   1. Verifique se o PHP-FPM está rodando com o usuário ${WEB_USER}"
echo "   2. Teste a geração do PDF novamente no aplicativo"
echo "   3. Se ainda não funcionar, verifique os logs do Laravel:"
echo "      tail -f ${STORAGE_DIR}/logs/la"ravel.log"
echo ""















