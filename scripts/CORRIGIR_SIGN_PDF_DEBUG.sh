#!/bin/bash

# Script para adicionar logs de debug e verificar o método signPDF

cd /var/www/lacos-backend || exit 1

echo "🔍 Verificando método signPDF..."
echo ""

# Procurar DigitalSignatureService
SERVICE_FILE="app/Services/DigitalSignatureService.php"
if [ ! -f "$SERVICE_FILE" ]; then
    echo "⚠️  DigitalSignatureService.php não encontrado"
    echo "📂 Procurando..."
    find . -name "*Signature*Service.php" 2>/dev/null | head -5
    exit 1
fi

echo "✅ Arquivo encontrado: $SERVICE_FILE"
echo ""

# Verificar método signPDF
echo "📋 Método signPDF:"
grep -A 30 "public function signPDF" "$SERVICE_FILE" | head -40

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar se há Storage::put ou método de salvar
if grep -q "Storage::put\|Storage::disk\|file_put_contents" "$SERVICE_FILE"; then
    echo "✅ Método parece salvar o arquivo"
    grep -n "Storage::put\|Storage::disk\|file_put_contents" "$SERVICE_FILE"
else
    echo "❌ PROBLEMA: Método signPDF não parece salvar o arquivo!"
    echo "   O método pode estar retornando o caminho sem salvar o arquivo"
fi

echo ""
echo "💡 SOLUÇÃO:"
echo "   O método signPDF() precisa salvar o arquivo antes de retornar o caminho"
echo "   ou verificar se o arquivo existe antes de calcular hash"

