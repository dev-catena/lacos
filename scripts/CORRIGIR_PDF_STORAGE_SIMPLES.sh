#!/bin/bash

# Script simples para substituir Storage::put() por file_put_contents()

set -e

echo "🔧 CORRIGINDO Storage::put() → file_put_contents()"
echo "=================================================="
echo ""

BACKEND_PATH="/var/www/lacos-backend"
SERVICE_FILE="${BACKEND_PATH}/app/Services/PdfService.php"

cd "$BACKEND_PATH" || exit 1

# Backup
cp "$SERVICE_FILE" "${SERVICE_FILE}.backup.$(date +%s)"
echo "   ✅ Backup criado"

echo "1️⃣ Substituindo Storage::put()..."

# Usar sed para substituição simples
sed -i 's/Storage::put(\$path, \$pdf->output());/\
            \/\/ Gerar output\
            \$pdfOutput = \$pdf->output();\
            if (empty(\$pdfOutput)) {\
                throw new \\Exception('\''PDF output está vazio.'\'');\
            }\
            \/\/ Salvar diretamente\
            \$fullPath = storage_path('\''app\/'\'' . \$path);\
            if (!is_dir(dirname(\$fullPath))) {\
                mkdir(dirname(\$fullPath), 0755, true);\
            }\
            \$bytesWritten = file_put_contents(\$fullPath, \$pdfOutput);\
            if (!file_exists(\$fullPath) || \$bytesWritten === false) {\
                throw new \\Exception('\''Erro ao salvar PDF: arquivo não foi criado em '\'' . \$fullPath);\
            }/g' "$SERVICE_FILE"

echo "   ✅ Substituição aplicada"

echo ""
echo "2️⃣ Verificando se a substituição funcionou..."
if grep -q "file_put_contents" "$SERVICE_FILE"; then
    echo "   ✅ file_put_contents encontrado no arquivo"
    if grep -q "Storage::put" "$SERVICE_FILE"; then
        echo "   ⚠️  Ainda há Storage::put no arquivo (pode ser em outro método)"
    else
        echo "   ✅ Storage::put removido completamente"
    fi
else
    echo "   ❌ file_put_contents não encontrado - substituição pode ter falhado"
    echo "   Restaurando backup..."
    cp "${SERVICE_FILE}.backup."* "$SERVICE_FILE" 2>/dev/null || echo "   ⚠️  Não foi possível restaurar backup"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ CORREÇÃO APLICADA"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "🔄 Teste a geração do PDF novamente"
echo ""




