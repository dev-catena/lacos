#!/bin/bash

cd /var/www/lacos-backend || exit 1

SERVICE_FILE="app/Services/PDFService.php"
BACKUP_FILE="${SERVICE_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

cp "$SERVICE_FILE" "$BACKUP_FILE"
echo "✅ Backup: $BACKUP_FILE"

python3 << 'EOF'
import re

arquivo = 'app/Services/PDFService.php'

with open(arquivo, 'r', encoding='utf-8') as f:
    linhas = f.readlines()

resultado = []
i = 0
encontrado = False

while i < len(linhas):
    linha = linhas[i]
    resultado.append(linha)
    
    # Procurar por Storage::put seguido de return $path no método generateCertificatePDF
    if 'Storage::put($path, $pdf->output());' in linha:
        # Próxima linha deve ser vazia e depois return $path
        if i + 1 < len(linhas) and linhas[i+1].strip() == '' and i + 2 < len(linhas) and 'return $path;' in linhas[i+2]:
            resultado.append('\n')
            resultado.append('            // Verificar se arquivo foi criado\n')
            resultado.append('            $fullPath = storage_path(\'app/\' . $path);\n')
            resultado.append('            if (!file_exists($fullPath)) {\n')
            resultado.append('                Log::error(\'Erro: PDF não foi criado após Storage::put()\', [\n')
            resultado.append('                    \'path\' => $path,\n')
            resultado.append('                    \'fullPath\' => $fullPath,\n')
            resultado.append('                    \'directory_exists\' => is_dir(dirname($fullPath)),\n')
            resultado.append('                    \'directory_writable\' => is_writable(dirname($fullPath)),\n')
            resultado.append('                ]);\n')
            resultado.append('                throw new \\Exception(\'Erro ao salvar PDF: arquivo não foi criado em \' . $fullPath);\n')
            resultado.append('            }\n')
            resultado.append('\n')
            resultado.append('            Log::info(\'PDF criado com sucesso\', [\n')
            resultado.append('                \'path\' => $path,\n')
            resultado.append('                \'fullPath\' => $fullPath,\n')
            resultado.append('                \'size\' => filesize($fullPath),\n')
            resultado.append('            ]);\n')
            resultado.append('\n')
            encontrado = True
            i += 1  # Pular linha vazia
            continue
    
    i += 1

with open(arquivo, 'w', encoding='utf-8') as f:
    f.writelines(resultado)

if encontrado:
    print("✅ Verificação adicionada!")
else:
    print("⚠️  Padrão não encontrado exatamente, mas arquivo foi processado")
EOF

if [ $? -eq 0 ]; then
    if php -l "$SERVICE_FILE" > /dev/null 2>&1; then
        echo "✅ Sintaxe PHP válida!"
        echo "✅ Correção aplicada!"
    else
        echo "❌ Erro de sintaxe! Restaurando backup..."
        cp "$BACKUP_FILE" "$SERVICE_FILE"
        php -l "$SERVICE_FILE"
        exit 1
    fi
else
    echo "❌ Erro ao processar arquivo"
    exit 1
fi

