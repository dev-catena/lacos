#!/bin/bash

# Script para corrigir erro de sintaxe na linha 428 do PrescriptionController.php

echo "🔧 CORRIGINDO ERRO DE SINTAXE NO PRESCRIPTIONCONTROLLER"
echo "======================================================="
echo ""

# Verificar se está no servidor
if [ ! -d "/var/www/lacos-backend" ]; then
    echo "❌ Este script deve ser executado no servidor (192.168.0.20)"
    echo "   Execute: ssh -p 63022 root@192.168.0.20"
    exit 1
fi

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/PrescriptionController.php"

if [ ! -f "$CONTROLLER_FILE" ]; then
    echo "❌ Arquivo não encontrado: $CONTROLLER_FILE"
    exit 1
fi

echo "1️⃣ Verificando linha 428 e contexto..."
echo "─────────────────────────────────────────────────────────"
sed -n '420,435p' "$CONTROLLER_FILE"
echo ""

echo "2️⃣ Verificando sintaxe PHP..."
if php -l "$CONTROLLER_FILE" 2>&1 | grep -q "Parse error"; then
    echo "❌ Erro de sintaxe encontrado:"
    php -l "$CONTROLLER_FILE"
    echo ""
    
    echo "3️⃣ Procurando por caracteres problemáticos na linha 428..."
    LINE_428=$(sed -n '428p' "$CONTROLLER_FILE")
    echo "Linha 428 atual: $LINE_428"
    echo ""
    
    # Verificar se há barras invertidas mal escapadas
    if echo "$LINE_428" | grep -q '\\\\'; then
        echo "⚠️  Encontradas barras invertidas duplas que podem estar causando o problema"
    fi
    
    # Verificar se há caracteres especiais
    if echo "$LINE_428" | grep -q '[^[:print:]]'; then
        echo "⚠️  Encontrados caracteres não imprimíveis"
    fi
    
    echo ""
    echo "4️⃣ Tentando corrigir automaticamente..."
    
    # Fazer backup
    cp "$CONTROLLER_FILE" "${CONTROLLER_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✅ Backup criado: ${CONTROLLER_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Verificar o contexto completo ao redor da linha 428
    echo ""
    echo "5️⃣ Contexto completo (linhas 420-440):"
    echo "─────────────────────────────────────────────────────────"
    sed -n '420,440p' "$CONTROLLER_FILE" | cat -A
    echo ""
    
    echo "═══════════════════════════════════════════════════════════"
    echo "💡 AÇÃO NECESSÁRIA:"
    echo ""
    echo "O erro está na linha 428. Verifique manualmente:"
    echo "   sed -n '420,440p' $CONTROLLER_FILE"
    echo ""
    echo "Possíveis causas:"
    echo "   • Barra invertida mal escapada (\\\\)"
    echo "   • Caractere especial não reconhecido"
    echo "   • Aspas não fechadas"
    echo "   • String mal formatada"
    echo ""
    echo "Para corrigir, edite o arquivo:"
    echo "   nano $CONTROLLER_FILE"
    echo "   (vá para a linha 428 e verifique/corrija)"
    echo ""
    echo "Ou use o script de instalação completo:"
    echo "   ./scripts/INSTALAR_TELEMEDICINA_BACKEND.sh"
    echo "═══════════════════════════════════════════════════════════"
    
else
    echo "✅ Nenhum erro de sintaxe encontrado!"
    echo "   O arquivo parece estar correto agora."
fi















