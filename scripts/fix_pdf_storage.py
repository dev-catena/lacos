#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import sys

file_path = sys.argv[1] if len(sys.argv) > 1 else '/var/www/lacos-backend/app/Services/PdfService.php'

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Padrão para encontrar Storage::put($path, $pdf->output())
    pattern = r'Storage::put\(\$path, \$pdf->output\(\)\);'
    
    replacement = '''// Gerar output do PDF
            $pdfOutput = $pdf->output();
            
            Log::info('PDF output gerado', [
                'path' => $path,
                'output_size' => strlen($pdfOutput),
                'output_empty' => empty($pdfOutput),
            ]);
            
            if (empty($pdfOutput)) {
                Log::error('ERRO: PDF output está vazio!');
                throw new \\Exception('PDF output está vazio. Verifique o template Blade.');
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
            
            Log::info('Arquivo salvo com file_put_contents', [
                'fullPath' => $fullPath,
                'bytes_written' => $bytesWritten,
                'file_exists' => file_exists($fullPath),
            ]);
            
            if (!file_exists($fullPath) || $bytesWritten === false) {
                Log::error('ERRO: Não foi possível salvar o arquivo!', [
                    'fullPath' => $fullPath,
                    'directory_writable' => is_writable($dir),
                    'bytes_written' => $bytesWritten,
                ]);
                throw new \\Exception('Erro ao salvar PDF: arquivo não foi criado em ' . $fullPath);
            }'''
    
    new_content = re.sub(pattern, replacement, content)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("✅ Storage::put() substituído por file_put_contents()")
        print("✅ Logs detalhados adicionados")
        sys.exit(0)
    else:
        if 'file_put_contents' in content:
            print("✅ Arquivo já foi modificado (já tem file_put_contents)")
            sys.exit(0)
        else:
            print("⚠️  Padrão não encontrado")
            print("Verificando se Storage::put existe...")
            if 'Storage::put' in content:
                print("⚠️  Storage::put encontrado mas padrão não correspondeu")
                print("Tente verificar manualmente")
            sys.exit(1)
    
except Exception as e:
    print(f"❌ Erro: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

