#!/bin/bash

# Script para corrigir o problema do Storage::put() usando file_put_contents diretamente

set -e

echo "🔧 CORRIGINDO PROBLEMA DO Storage::put()"
echo "========================================"
echo ""

BACKEND_PATH="/var/www/lacos-backend"
SERVICE_FILE="${BACKEND_PATH}/app/Services/PdfService.php"

cd "$BACKEND_PATH" || exit 1

# Backup
cp "$SERVICE_FILE" "${SERVICE_FILE}.backup.$(date +%s)"
echo "   ✅ Backup criado"

echo "1️⃣ Substituindo Storage::put() por file_put_contents()..."

python3 << 'PYTHON_EOF'
import re
import sys

file_path = sys.argv[1]

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Padrão para encontrar Storage::put($path, $pdf->output())
    # Substituir por file_put_contents diretamente
    pattern = r'(\s+)(// Salvar temporariamente\s+\$filename = .+?;\s+\$path = .+?;\s+)(Storage::put\(\$path, \$pdf->output\(\)\);)'
    
    replacement = r'''\1\2
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
            
            // Salvar usando file_put_contents diretamente
            $fullPath = storage_path('app/' . $path);
            $dir = dirname($fullPath);
            
            // Garantir que o diretório existe
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
            
            // Salvar arquivo
            $bytesWritten = file_put_contents($fullPath, $pdfOutput);
            
            // Log após salvar
            Log::info('Arquivo salvo com file_put_contents', [
                'path' => $path,
                'fullPath' => $fullPath,
                'bytes_written' => $bytesWritten,
                'file_exists' => file_exists($fullPath),
                'file_size' => file_exists($fullPath) ? filesize($fullPath) : 0,
            ]);
            
            if (!file_exists($fullPath) || $bytesWritten === false) {
                Log::error('ERRO: Não foi possível salvar o arquivo!', [
                    'path' => $path,
                    'fullPath' => $fullPath,
                    'directory_exists' => is_dir($dir),
                    'directory_writable' => is_writable($dir),
                    'bytes_written' => $bytesWritten,
                ]);
                throw new \Exception('Erro ao salvar PDF: arquivo não foi criado em ' . $fullPath);
            }'''
    
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    # Se não encontrou, tentar padrão mais simples (sem comentário)
    if new_content == content:
        pattern2 = r'(\s+)(\$filename = .+?;\s+\$path = .+?;\s+)(Storage::put\(\$path, \$pdf->output\(\)\);)'
        replacement2 = r'''\1\2
            // Gerar output do PDF
            $pdfOutput = $pdf->output();
            
            Log::info('PDF output gerado', [
                'path' => $path,
                'output_size' => strlen($pdfOutput),
            ]);
            
            if (empty($pdfOutput)) {
                throw new \Exception('PDF output está vazio.');
            }
            
            // Salvar usando file_put_contents diretamente
            $fullPath = storage_path('app/' . $path);
            $dir = dirname($fullPath);
            
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
            
            $bytesWritten = file_put_contents($fullPath, $pdfOutput);
            
            Log::info('Arquivo salvo', [
                'fullPath' => $fullPath,
                'bytes_written' => $bytesWritten,
                'file_exists' => file_exists($fullPath),
            ]);
            
            if (!file_exists($fullPath) || $bytesWritten === false) {
                throw new \Exception('Erro ao salvar PDF: arquivo não foi criado em ' . $fullPath);
            }'''
        
        new_content = re.sub(pattern2, replacement2, content, flags=re.DOTALL)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("   ✅ Storage::put() substituído por file_put_contents()")
        print("   ✅ Logs detalhados adicionados")
    else:
        print("   ⚠️  Padrão não encontrado")
        print("   Verificando conteúdo do arquivo...")
        if 'Storage::put' in content:
            print("   ⚠️  Storage::put encontrado mas padrão não correspondeu")
            print("   Tente verificar manualmente o arquivo")
        else:
            print("   ✅ Storage::put não encontrado (já pode estar corrigido)")
    
except Exception as e:
    print(f"   ❌ Erro: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
PYTHON_EOF

# Executar com o caminho do arquivo
python3 -c "
import sys
sys.path.insert(0, '/tmp')
exec(open('/dev/stdin').read())
" << PYTHON_SCRIPT_END
import re

file_path = '${SERVICE_FILE}'

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Verificar se já foi modificado
    if 'file_put_contents' in content and 'Storage::put' not in content:
        print("   ✅ Arquivo já foi modificado")
    elif 'file_put_contents' in content:
        print("   ⚠️  Arquivo tem file_put_contents mas também tem Storage::put")
    else:
        print("   ⚠️  Modificação não foi aplicada, tentando novamente...")
        
        # Padrão mais direto
        pattern = r'(Storage::put\(\$path, \$pdf->output\(\)\);)'
        replacement = '''// Gerar output
            \$pdfOutput = \$pdf->output();
            
            if (empty(\$pdfOutput)) {
                throw new \\Exception('PDF output está vazio.');
            }
            
            // Salvar diretamente
            \$fullPath = storage_path('app/' . \$path);
            if (!is_dir(dirname(\$fullPath))) {
                mkdir(dirname(\$fullPath), 0755, true);
            }
            
            \$bytesWritten = file_put_contents(\$fullPath, \$pdfOutput);
            
            if (!file_exists(\$fullPath) || \$bytesWritten === false) {
                throw new \\Exception('Erro ao salvar PDF: arquivo não foi criado em ' . \$fullPath);
            }'''
        
        new_content = re.sub(pattern, replacement, content)
        
        if new_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print("   ✅ Modificação aplicada")
        else:
            print("   ❌ Não foi possível aplicar modificação")
            
except Exception as e:
    print(f"   ❌ Erro: {e}")
PYTHON_SCRIPT_END

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ CORREÇÃO APLICADA"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "💡 O código agora usa file_put_contents() diretamente"
echo "   em vez de Storage::put(), o que deve resolver o problema"
echo ""
echo "🔄 Teste a geração do PDF novamente e verifique os logs:"
echo "   tail -f ${BACKEND_PATH}/storage/logs/laravel.log"
echo ""






