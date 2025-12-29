#!/bin/bash

# Script final para corrigir o problema do PDF

set -e

echo "🔧 CORREÇÃO FINAL: SUBSTITUIR Storage::put()"
echo "============================================="
echo ""

BACKEND_PATH="/var/www/lacos-backend"
SERVICE_FILE="${BACKEND_PATH}/app/Services/PdfService.php"

cd "$BACKEND_PATH" || exit 1

# Backup
cp "$SERVICE_FILE" "${SERVICE_FILE}.backup.$(date +%s)"
echo "   ✅ Backup criado"

echo "1️⃣ Aplicando correção..."

# Copiar script Python para o servidor se necessário
if [ ! -f "/tmp/fix_pdf_storage.py" ]; then
    echo "   ⚠️  Script Python não encontrado, usando método alternativo..."
    
    # Usar Python inline
    python3 << 'PYTHON_SCRIPT'
import re
import sys

file_path = '/var/www/lacos-backend/app/Services/PdfService.php'

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    pattern = r'Storage::put\(\$path, \$pdf->output\(\)\);'
    
    replacement = '''// Gerar output do PDF
            $pdfOutput = $pdf->output();
            
            Log::info('PDF output gerado', [
                'path' => $path,
                'output_size' => strlen($pdfOutput),
            ]);
            
            if (empty($pdfOutput)) {
                throw new \\Exception('PDF output está vazio.');
            }
            
            // Salvar usando file_put_contents diretamente
            $fullPath = storage_path('app/' . $path);
            $dir = dirname($fullPath);
            
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
            
            $bytesWritten = file_put_contents($fullPath, $pdfOutput);
            
            if (!file_exists($fullPath) || $bytesWritten === false) {
                throw new \\Exception('Erro ao salvar PDF: arquivo não foi criado em ' . $fullPath);
            }'''
    
    new_content = re.sub(pattern, replacement, content)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("   ✅ Correção aplicada com sucesso!")
    else:
        if 'file_put_contents' in content:
            print("   ✅ Arquivo já foi modificado")
        else:
            print("   ⚠️  Padrão não encontrado")
            
except Exception as e:
    print(f"   ❌ Erro: {e}")
    sys.exit(1)
PYTHON_SCRIPT
else
    python3 /tmp/fix_pdf_storage.py "$SERVICE_FILE"
fi

echo ""
echo "2️⃣ Verificando resultado..."
if grep -q "file_put_contents" "$SERVICE_FILE"; then
    echo "   ✅ file_put_contents encontrado"
else
    echo "   ❌ file_put_contents não encontrado"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ CORREÇÃO CONCLUÍDA"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "🔄 Teste a geração do PDF novamente"
echo "   Os logs mostrarão detalhes sobre o processo"
echo ""




