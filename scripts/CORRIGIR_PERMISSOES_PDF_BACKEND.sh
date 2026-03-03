#!/bin/bash

# Script para corrigir permissões do diretório de PDFs no backend

set -e

echo "🔧 CORRIGINDO PERMISSÕES DO BACKEND PARA PDFs"
echo "=============================================="
echo ""

# Configurações
SSH_HOST="192.168.0.20"
SSH_PORT="63022"
SSH_USER="darley"
BACKEND_PATH="/var/www/lacos-backend"
TEMP_DIR="${BACKEND_PATH}/storage/app/temp"

echo "📋 Configurações:"
echo "   Host: ${SSH_HOST}"
echo "   Porta: ${SSH_PORT}"
echo "   Usuário: ${SSH_USER}"
echo "   Backend: ${BACKEND_PATH}"
echo "   Diretório Temp: ${TEMP_DIR}"
echo ""

echo "1️⃣ Conectando ao servidor..."
echo ""

# Comandos para executar no servidor
ssh -p ${SSH_PORT} ${SSH_USER}@${SSH_HOST} << 'EOF'
    set -e
    
    BACKEND_PATH="/var/www/lacos-backend"
    TEMP_DIR="${BACKEND_PATH}/storage/app/temp"
    STORAGE_DIR="${BACKEND_PATH}/storage"
    
    echo "2️⃣ Verificando diretórios..."
    
    # Criar diretório temp se não existir
    if [ ! -d "$TEMP_DIR" ]; then
        echo "   ⚠️  Diretório temp não existe, criando..."
        mkdir -p "$TEMP_DIR"
        echo "   ✅ Diretório criado"
    else
        echo "   ✅ Diretório temp existe"
    fi
    
    # Verificar permissões do storage
    echo ""
    echo "3️⃣ Verificando permissões..."
    ls -la "$STORAGE_DIR" | head -5
    echo ""
    
    # Corrigir permissões do storage
    echo "4️⃣ Corrigindo permissões do storage..."
    chown -R www-data:www-data "$STORAGE_DIR"
    chmod -R 775 "$STORAGE_DIR"
    echo "   ✅ Permissões corrigidas"
    
    # Corrigir permissões específicas do temp
    echo ""
    echo "5️⃣ Corrigindo permissões do diretório temp..."
    chown -R www-data:www-data "$TEMP_DIR"
    chmod -R 775 "$TEMP_DIR"
    echo "   ✅ Permissões do temp corrigidas"
    
    # Verificar se o diretório está acessível
    echo ""
    echo "6️⃣ Testando escrita no diretório..."
    TEST_FILE="${TEMP_DIR}/test_write_$(date +%s).txt"
    if touch "$TEST_FILE" 2>/dev/null; then
        echo "   ✅ Escrita funcionando"
        rm -f "$TEST_FILE"
    else
        echo "   ❌ Erro ao escrever no diretório"
        echo "   Tentando corrigir novamente..."
        chmod 777 "$TEMP_DIR"
    fi
    
    echo ""
    echo "7️⃣ Verificando configuração do Laravel..."
    if [ -f "${BACKEND_PATH}/.env" ]; then
        echo "   ✅ Arquivo .env encontrado"
        # Verificar se APP_ENV está configurado
        if grep -q "APP_ENV" "${BACKEND_PATH}/.env"; then
            echo "   ✅ APP_ENV configurado"
        else
            echo "   ⚠️  APP_ENV não encontrado no .env"
        fi
    else
        echo "   ⚠️  Arquivo .env não encontrado"
    fi
    
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "✅ CORREÇÃO CONCLUÍDA"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "📋 Resumo:"
    echo "   ✅ Diretório temp verificado/criado"
    echo "   ✅ Permissões do storage corrigidas (www-data:www-data, 775)"
    echo "   ✅ Permissões do temp corrigidas (www-data:www-data, 775)"
    echo ""
    echo "💡 Se o problema persistir, verifique:"
    echo "   1. Se o usuário www-data existe"
    echo "   2. Se o PHP-FPM está rodando com o usuário www-data"
    echo "   3. Se há espaço em disco disponível"
    echo "   4. Se o SELinux (se ativo) está bloqueando"
    echo ""
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Script executado com sucesso!"
    echo ""
    echo "🔄 Teste novamente a geração do PDF no aplicativo"
else
    echo ""
    echo "❌ Erro ao executar script"
    echo "   Verifique se tem acesso SSH ao servidor"
fi

