#!/bin/bash

# Script para adicionar logs detalhados no PdfService (versão corrigida)

set -e

echo "🔧 ADICIONANDO LOGS DETALHADOS NO PDFSERVICE"
echo "=============================================="
echo ""

BACKEND_PATH="/var/www/lacos-backend"
SERVICE_FILE="${BACKEND_PATH}/app/Services/PdfService.php"

cd "$BACKEND_PATH" || exit 1

# Backup
cp "$SERVICE_FILE" "${SERVICE_FILE}.backup.$(date +%s)"
echo "   ✅ Backup criado"

echo "1️⃣ Adicionando logs antes e depois do Storage::put()..."

# Criar script Python temporário
PYTHON_SCRIPT=$(mktemp)
cat > "$PYTHON_SCRIPT" << 'PYTHON_EOF'
import re
import sys

file_path = sys.argv[1]

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Padrão para encontrar Storage::put e adicionar logs antes e depois
    pattern = r'(// Salvar temporariamente\s+\$filename = .+?;\s+\$path = .+?;\s+)(Storage::put\(\$path, \$pdf->output\(\)\);)'
    
    replacement = r'''\1
            // Log antes de gerar output
            Log::info('Gerando PDF - Antes de output()', [
                'path' => $path,
                'data_keys' => array_keys($data),
            ]);
            
            // Gerar output do PDF
            $pdfOutput = $pdf->output();
            
            // Log após gerar output
            Log::info('PDF output gerado', [
                'path' => $path,
                'output_size' => strlen($pdfOutput),
                'output_empty' => empty($pdfOutput),
            ]);
            
            if (empty($pdfOutput)) {
                Log::error('ERRO CRÍTICO: PDF output está vazio!', [
                    'path' => $path,
                    'template' => 'prescriptions.certificate',
                ]);
                throw new \Exception('PDF output está vazio. Verifique o template Blade.');
            }
            
            // Tentar salvar
            \2
            
            // Log após Storage::put
            Log::info('Storage::put() executado', [
                'path' => $path,
            ]);'''
    
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("   ✅ Logs adicionados com sucesso")
    else:
        print("   ⚠️  Padrão não encontrado. Tentando padrão alternativo...")
        
        # Tentar padrão mais simples
        pattern2 = r'(\$path = .+?;\s+)(Storage::put\(\$path, \$pdf->output\(\)\);)'
        replacement2 = r'''\1
            // Log antes de gerar output
            $pdfOutput = $pdf->output();
            Log::info('PDF output gerado', [
                'path' => $path,
                'output_size' => strlen($pdfOutput),
                'output_empty' => empty($pdfOutput),
            ]);
            
            if (empty($pdfOutput)) {
                Log::error('ERRO: PDF output está vazio!');
                throw new \Exception('PDF output está vazio.');
            }
            
            \2'''
        
        new_content = re.sub(pattern2, replacement2, content, flags=re.DOTALL)
        
        if new_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print("   ✅ Logs adicionados (padrão alternativo)")
        else:
            print("   ❌ Não foi possível adicionar logs automaticamente")
            print("   Verifique manualmente o arquivo: " + file_path)
    
except Exception as e:
    print(f"   ❌ Erro: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
PYTHON_EOF

# Executar script Python
python3 "$PYTHON_SCRIPT" "$SERVICE_FILE"

# Limpar
rm -f "$PYTHON_SCRIPT"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ LOGS ADICIONADOS"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "💡 Agora teste a geração do PDF e verifique os logs:"
echo "   tail -f ${BACKEND_PATH}/storage/logs/laravel.log"
echo ""
echo "   Os logs mostrarão:"
echo "   - Se o PDF output está sendo gerado"
echo "   - O tamanho do output"
echo "   - Se está vazio (o que causaria o problema)"
echo ""






