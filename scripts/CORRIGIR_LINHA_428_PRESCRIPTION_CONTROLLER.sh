#!/bin/bash

# Script para corrigir erro de sintaxe na linha 428 do PrescriptionController.php
# O problema são aspas simples escapadas incorretamente (\')

echo "🔧 CORRIGINDO ERRO DE SINTAXE NA LINHA 428"
echo "=========================================="
echo ""

# Verificar se está no servidor
if [ ! -d "/var/www/lacos-backend" ]; then
    echo "❌ Este script deve ser executado no servidor (193.203.182.22)"
    echo "   Execute: ssh -p 63022 root@193.203.182.22"
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

# Mostrar linha problemática antes
echo "1️⃣ Linha 428 ANTES da correção:"
echo "─────────────────────────────────────────────────────────"
sed -n '428p' "$CONTROLLER_FILE"
echo ""

# Corrigir a linha 428 - substituir \' por '
# A linha problemática é:
# Log::info(\'PDF gerado\', [\'pdfPath\' => $pdfPath, \'exists\' => Storage::exists($pdfPath), \'fullPath\' => storage_path(\'app/\' . $pdfPath)]);
# Deve ser:
# Log::info('PDF gerado', ['pdfPath' => $pdfPath, 'exists' => Storage::exists($pdfPath), 'fullPath' => storage_path('app/' . $pdfPath)]);

echo "2️⃣ Aplicando correção..."
sed -i "428s/\\\\'/'/g" "$CONTROLLER_FILE"
echo "✅ Correção aplicada (substituindo \\' por ')"
echo ""

# Verificar se há outras linhas com o mesmo problema nas proximidades
echo "3️⃣ Verificando outras linhas com problema similar..."
LINES_WITH_ESCAPED_QUOTES=$(sed -n '420,440p' "$CONTROLLER_FILE" | grep -n "\\\\'" | wc -l)
if [ "$LINES_WITH_ESCAPED_QUOTES" -gt 0 ]; then
    echo "⚠️  Encontradas $LINES_WITH_ESCAPED_QUOTES linhas com aspas escapadas incorretamente"
    echo "   Corrigindo todas nas linhas 420-440..."
    sed -i '420,440s/\\'"'"'/'"'"'/g' "$CONTROLLER_FILE"
    echo "✅ Todas as aspas escapadas corrigidas"
else
    echo "✅ Nenhuma outra linha com problema encontrada"
fi
echo ""

# Mostrar linha corrigida
echo "4️⃣ Linha 428 DEPOIS da correção:"
echo "─────────────────────────────────────────────────────────"
sed -n '428p' "$CONTROLLER_FILE"
echo ""

# Verificar sintaxe
echo "5️⃣ Verificando sintaxe PHP..."
if php -l "$CONTROLLER_FILE" 2>&1 | grep -q "Parse error"; then
    echo "❌ Ainda há erro de sintaxe:"
    php -l "$CONTROLLER_FILE"
    echo ""
    echo "⚠️  Restaurando backup..."
    cp "$BACKUP_FILE" "$CONTROLLER_FILE"
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "❌ CORREÇÃO FALHOU"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "O erro persiste. Verifique manualmente:"
    echo "   sed -n '420,440p' $CONTROLLER_FILE"
    exit 1
else
    echo "✅ Sintaxe PHP correta!"
    echo ""
    
    # Limpar cache
    echo "6️⃣ Limpando cache do Laravel..."
    php artisan config:clear 2>/dev/null || true
    php artisan cache:clear 2>/dev/null || true
    php artisan view:clear 2>/dev/null || true
    echo "✅ Cache limpo"
    echo ""
    
    echo "═══════════════════════════════════════════════════════════"
    echo "✅ CORREÇÃO APLICADA COM SUCESSO!"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "O erro de sintaxe foi corrigido."
    echo "A linha 428 agora está correta."
    echo ""
    echo "Teste novamente a geração de atestado."
    echo ""
    echo "💡 Se ainda houver problemas, verifique:"
    echo "   • Se o PDFService está funcionando"
    echo "   • Se o DigitalSignatureService está funcionando"
    echo "   • Se os diretórios de storage têm permissões corretas"
fi










