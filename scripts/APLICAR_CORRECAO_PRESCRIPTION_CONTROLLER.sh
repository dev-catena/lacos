#!/bin/bash

# Script para aplicar correção no PrescriptionController.php
# Corrige erro de sintaxe na linha 428

echo "🔧 APLICANDO CORREÇÃO NO PRESCRIPTIONCONTROLLER"
echo "=============================================="
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

# Fazer backup
BACKUP_FILE="${CONTROLLER_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# Verificar sintaxe antes
echo "1️⃣ Verificando sintaxe antes da correção..."
if php -l "$CONTROLLER_FILE" 2>&1 | grep -q "Parse error"; then
    echo "❌ Erro encontrado:"
    php -l "$CONTROLLER_FILE"
    echo ""
    
    # Mostrar linha 428 e contexto
    echo "2️⃣ Linha 428 e contexto:"
    echo "─────────────────────────────────────────────────────────"
    sed -n '420,440p' "$CONTROLLER_FILE" | nl -v 420
    echo ""
    
    # Tentar identificar o problema
    LINE_428=$(sed -n '428p' "$CONTROLLER_FILE")
    echo "3️⃣ Linha 428 atual:"
    echo "$LINE_428"
    echo ""
    
    # Verificar se é um problema comum de escape
    if echo "$LINE_428" | grep -qE '\\\\[^nrt]'; then
        echo "⚠️  Possível problema: barra invertida mal escapada"
        echo "   Corrigindo..."
        
        # Tentar corrigir barras invertidas duplas desnecessárias
        sed -i '428s/\\\\\\\\/\\/g' "$CONTROLLER_FILE"
        sed -i '428s/\\"/"/g' "$CONTROLLER_FILE"
        
        echo "✅ Correção aplicada (barras invertidas)"
    fi
    
    # Verificar sintaxe novamente
    echo ""
    echo "4️⃣ Verificando sintaxe após correção..."
    if php -l "$CONTROLLER_FILE" 2>&1 | grep -q "Parse error"; then
        echo "❌ Ainda há erro de sintaxe:"
        php -l "$CONTROLLER_FILE"
        echo ""
        echo "⚠️  Restaurando backup..."
        cp "$BACKUP_FILE" "$CONTROLLER_FILE"
        echo ""
        echo "═══════════════════════════════════════════════════════════"
        echo "❌ CORREÇÃO AUTOMÁTICA FALHOU"
        echo "═══════════════════════════════════════════════════════════"
        echo ""
        echo "O erro precisa ser corrigido manualmente."
        echo ""
        echo "1. Veja a linha 428:"
        echo "   sed -n '420,440p' $CONTROLLER_FILE"
        echo ""
        echo "2. Edite o arquivo:"
        echo "   nano $CONTROLLER_FILE"
        echo ""
        echo "3. Procure por:"
        echo "   • Barras invertidas duplas (\\\\)"
        echo "   • Aspas não fechadas"
        echo "   • Caracteres especiais"
        echo ""
        echo "4. Ou reinstale o controller completo:"
        echo "   ./scripts/INSTALAR_TELEMEDICINA_BACKEND.sh"
        echo "═══════════════════════════════════════════════════════════"
        exit 1
    else
        echo "✅ Sintaxe corrigida!"
        echo ""
        echo "5️⃣ Limpando cache do Laravel..."
        php artisan config:clear
        php artisan cache:clear
        php artisan view:clear
        echo "✅ Cache limpo"
        echo ""
        echo "═══════════════════════════════════════════════════════════"
        echo "✅ CORREÇÃO APLICADA COM SUCESSO!"
        echo "═══════════════════════════════════════════════════════════"
        echo ""
        echo "O erro de sintaxe foi corrigido."
        echo "Teste novamente a geração de atestado."
    fi
else
    echo "✅ Nenhum erro de sintaxe encontrado!"
    echo "   O arquivo já está correto."
fi















