#!/bin/bash

# Script para corrigir manualmente o PdfService.php

set -e

BACKEND_PATH="/var/www/lacos-backend"
SERVICE_FILE="${BACKEND_PATH}/app/Services/PdfService.php"

cd "$BACKEND_PATH" || exit 1

echo "🔧 CORREÇÃO MANUAL DO PDFSERVICE"
echo "================================="
echo ""

# Backup
cp "$SERVICE_FILE" "${SERVICE_FILE}.backup.manual.$(date +%s)"
echo "✅ Backup criado"

echo "1️⃣ Verificando estado atual..."
if grep -q "file_put_contents" "$SERVICE_FILE"; then
    echo "   ✅ Arquivo já tem file_put_contents"
    exit 0
fi

if ! grep -q "Storage::put" "$SERVICE_FILE"; then
    echo "   ✅ Storage::put não encontrado (já pode estar corrigido)"
    exit 0
fi

echo "2️⃣ Aplicando correção com sed..."

# Encontrar a linha com Storage::put e substituir
sed -i '/Storage::put(\$path, \$pdf->output());/{
    i\
            // Gerar output do PDF\
            $pdfOutput = $pdf->output();\
            \
            Log::info('\''PDF output gerado'\'', [\
                '\''path'\'' => $path,\
                '\''output_size'\'' => strlen($pdfOutput),\
            ]);\
            \
            if (empty($pdfOutput)) {\
                throw new \\Exception('\''PDF output está vazio.'\'');\
            }\
            \
            // Salvar usando file_put_contents diretamente\
            $fullPath = storage_path('\''app/'\'' . $path);\
            $dir = dirname($fullPath);\
            \
            if (!is_dir($dir)) {\
                mkdir($dir, 0755, true);\
            }\
            \
            $bytesWritten = file_put_contents($fullPath, $pdfOutput);\
            \
            if (!file_exists($fullPath) || $bytesWritten === false) {\
                throw new \\Exception('\''Erro ao salvar PDF: arquivo não foi criado em '\'' . $fullPath);\
            }
    d
}' "$SERVICE_FILE"

echo "   ✅ Correção aplicada"

echo ""
echo "3️⃣ Verificando resultado..."
if grep -q "file_put_contents" "$SERVICE_FILE"; then
    echo "   ✅ file_put_contents encontrado"
else
    echo "   ❌ file_put_contents não encontrado - tentando método alternativo..."
    
    # Método alternativo: usar perl
    perl -i -pe 's/Storage::put\(\$path, \$pdf->output\(\)\);/\/\/ Gerar output\n            \$pdfOutput = \$pdf->output();\n            \n            if (empty(\$pdfOutput)) {\n                throw new \\Exception('\''PDF output está vazio.'\'');\n            }\n            \n            \$fullPath = storage_path('\''app\/'\'' . \$path);\n            if (!is_dir(dirname(\$fullPath))) {\n                mkdir(dirname(\$fullPath), 0755, true);\n            }\n            \n            \$bytesWritten = file_put_contents(\$fullPath, \$pdfOutput);\n            \n            if (!file_exists(\$fullPath) || \$bytesWritten === false) {\n                throw new \\Exception('\''Erro ao salvar PDF: arquivo não foi criado em '\'' . \$fullPath);\n            }/g' "$SERVICE_FILE"
    
    if grep -q "file_put_contents" "$SERVICE_FILE"; then
        echo "   ✅ Correção aplicada com perl"
    else
        echo "   ❌ Não foi possível aplicar correção automaticamente"
        echo "   Execute manualmente:"
        echo "   nano $SERVICE_FILE"
        echo "   Procure por: Storage::put(\$path, \$pdf->output());"
        echo "   Substitua pelo código com file_put_contents"
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ CORREÇÃO CONCLUÍDA"
echo "═══════════════════════════════════════════════════════════"
echo ""















