#!/bin/bash

# Script alternativo usando Python para adicionar verificação

cd /var/www/lacos-backend || exit 1

SERVICE_FILE="app/Services/PDFService.php"

# Backup
cp "$SERVICE_FILE" "${SERVICE_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

python3 << 'PYTHON_SCRIPT'
import re

arquivo = 'app/Services/PDFService.php'

with open(arquivo, 'r') as f:
    conteudo = f.read()

# Substituir Storage::put() seguido de return $path no método generateCertificatePDF
padrao = r'(            Storage::put\(\$path, \$pdf->output\(\)\);\s*\n\s*)(return \$path;)'

substituicao = r'''\1
            // Verificar se arquivo foi criado
            $fullPath = storage_path('app/' . $path);
            if (!file_exists($fullPath)) {
                Log::error('Erro: PDF não foi criado após Storage::put()', [
                    'path' => $path,
                    'fullPath' => $fullPath,
                    'directory_exists' => is_dir(dirname($fullPath)),
                    'directory_writable' => is_writable(dirname($fullPath)),
                ]);
                throw new \Exception('Erro ao salvar PDF: arquivo não foi criado em ' . $fullPath);
            }

            Log::info('PDF criado com sucesso', [
                'path' => $path,
                'fullPath' => $fullPath,
                'size' => filesize($fullPath),
            ]);

            \2'''

conteudo_novo = re.sub(padrao, substituicao, conteudo)

with open(arquivo, 'w') as f:
    f.write(conteudo_novo)

print("✅ Verificação adicionada!")
PYTHON_SCRIPT

# Verificar sintaxe
php -l "$SERVICE_FILE" && echo "✅ Sintaxe OK!" || echo "❌ Erro de sintaxe!"

