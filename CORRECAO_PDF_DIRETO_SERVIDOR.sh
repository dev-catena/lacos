#!/bin/bash

# Execute este script diretamente no servidor

cd /var/www/lacos-backend || exit 1

SERVICE_FILE="app/Services/PDFService.php"

echo "🔍 Verificando PDFService.php..."
echo ""

# Verificar se já tem a verificação
if grep -q "Verificar se arquivo foi criado" "$SERVICE_FILE"; then
    echo "✅ Verificação já existe!"
    exit 0
fi

# Backup
BACKUP_FILE="${SERVICE_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$SERVICE_FILE" "$BACKUP_FILE"
echo "✅ Backup: $BACKUP_FILE"
echo ""

# Aplicar correção
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
    
    # Procurar Storage::put no método generateCertificatePDF
    if 'Storage::put($path, $pdf->output());' in linha:
        resultado.append(linha)
        resultado.append('\n')
        resultado.append('            // Verificar se arquivo foi criado\n')
        resultado.append('            $fullPath = storage_path(\'app/\' . $path);\n')
        resultado.append('            if (!file_exists($fullPath)) {\n')
        resultado.append('                Log::error(\'Erro: PDF não foi criado após Storage::put()\', [\n')
        resultado.append('                    \'path\' => $path,\n')
        resultado.append('                    \'fullPath\' => $fullPath,\n')
        resultado.append('                    \'directory_exists\' => is_dir(dirname($fullPath)),\n')
        resultado.append('                    \'directory_writable\' => is_writable(dirname($fullPath)),\n')
        resultado.append('                    \'disk_free_space\' => disk_free_space(dirname($fullPath)),\n')
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
    else:
        resultado.append(linha)
    
    i += 1

if not encontrado:
    print("❌ Não encontrado Storage::put no arquivo")
    exit(1)

with open(arquivo, 'w', encoding='utf-8') as f:
    f.writelines(resultado)

print("✅ Verificação adicionada!")
EOF

if [ $? -eq 0 ]; then
    echo ""
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
    echo "❌ Erro ao aplicar correção"
    exit 1
fi



