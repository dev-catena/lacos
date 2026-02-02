#!/bin/bash

# Script para adicionar verificação no método generateCertificatePDF

cd /var/www/lacos-backend || exit 1

echo "🔧 Adicionando verificação no método generateCertificatePDF..."
echo ""

# Tentar ambos os nomes possíveis
SERVICE_FILE=""
if [ -f "app/Services/PDFService.php" ]; then
    SERVICE_FILE="app/Services/PDFService.php"
elif [ -f "app/Services/PdfService.php" ]; then
    SERVICE_FILE="app/Services/PdfService.php"
else
    echo "❌ PDFService.php não encontrado!"
    echo "📂 Procurando..."
    find . -name "*PdfService*" -o -name "*PDFService*" -type f 2>/dev/null | head -5
    exit 1
fi

# Criar backup
BACKUP_FILE="${SERVICE_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$SERVICE_FILE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# Adicionar verificação após Storage::put()
python3 << 'PYTHON_SCRIPT'
import re
import sys
import os

# Tentar encontrar o arquivo
arquivo = None
for nome in ['app/Services/PDFService.php', 'app/Services/PdfService.php']:
    if os.path.exists(nome):
        arquivo = nome
        break

if not arquivo:
    print("❌ PDFService.php não encontrado!", file=sys.stderr)
    sys.exit(1)

try:
    with open(arquivo, 'r', encoding='utf-8') as f:
        conteudo = f.read()
except Exception as e:
    print(f"❌ Erro: {e}", file=sys.stderr)
    sys.exit(1)

# Procurar Storage::put() e adicionar verificação após
padrao = r'(Storage::put\(\$path, \$pdf->output\(\)\);)\s*(return \$path;)'

codigo_verificacao = """Storage::put($path, $pdf->output());

            // Verificar se arquivo foi criado
            $fullPath = storage_path('app/' . $path);
            if (!file_exists($fullPath)) {
                Log::error('Erro: PDF não foi criado após Storage::put()', [
                    'path' => $path,
                    'fullPath' => $fullPath,
                    'directory_exists' => is_dir(dirname($fullPath)),
                    'directory_writable' => is_writable(dirname($fullPath)),
                ]);
                throw new \\Exception('Erro ao salvar PDF: arquivo não foi criado em ' . $fullPath);
            }

            Log::info('PDF criado com sucesso', [
                'path' => $path,
                'fullPath' => $fullPath,
                'size' => filesize($fullPath),
            ]);

            return $path;"""

# Substituir
conteudo_novo = re.sub(padrao, codigo_verificacao, conteudo, flags=re.DOTALL)

if conteudo_novo == conteudo:
    print("⚠️  Padrão não encontrado, tentando abordagem diferente...", file=sys.stderr)
    
    # Tentar substituir linha por linha
    linhas = conteudo.split('\n')
    resultado = []
    i = 0
    
    while i < len(linhas):
        linha = linhas[i]
        resultado.append(linha)
        
        # Se encontrar Storage::put($path, $pdf->output());
        if 'Storage::put($path, $pdf->output());' in linha:
            # Adicionar verificação após essa linha
            indentacao = len(linha) - len(linha.lstrip())
            indent_str = ' ' * indentacao
            
            resultado.append('')
            resultado.append(indent_str + '// Verificar se arquivo foi criado')
            resultado.append(indent_str + '$fullPath = storage_path(\'app/\' . $path);')
            resultado.append(indent_str + 'if (!file_exists($fullPath)) {')
            resultado.append(indent_str + '    Log::error(\'Erro: PDF não foi criado após Storage::put()\', [')
            resultado.append(indent_str + '        \'path\' => $path,')
            resultado.append(indent_str + '        \'fullPath\' => $fullPath,')
            resultado.append(indent_str + '        \'directory_exists\' => is_dir(dirname($fullPath)),')
            resultado.append(indent_str + '        \'directory_writable\' => is_writable(dirname($fullPath)),')
            resultado.append(indent_str + '    ]);')
            resultado.append(indent_str + '    throw new \\Exception(\'Erro ao salvar PDF: arquivo não foi criado em \' . $fullPath);')
            resultado.append(indent_str + '}')
            resultado.append('')
            resultado.append(indent_str + 'Log::info(\'PDF criado com sucesso\', [')
            resultado.append(indent_str + '    \'path\' => $path,')
            resultado.append(indent_str + '    \'fullPath\' => $fullPath,')
            resultado.append(indent_str + '    \'size\' => filesize($fullPath),')
            resultado.append(indent_str + ']);')
        
        i += 1
    
    conteudo_novo = '\n'.join(resultado)

# Verificar se Log está importado
if 'use Illuminate\\Support\\Facades\\Log;' not in conteudo_novo:
    # Adicionar import do Log
    if 'use Illuminate\\Support\\Facades\\Storage;' in conteudo_novo:
        conteudo_novo = conteudo_novo.replace(
            'use Illuminate\\Support\\Facades\\Storage;',
            'use Illuminate\\Support\\Facades\\Storage;\nuse Illuminate\\Support\\Facades\\Log;'
        )
    else:
        # Adicionar após namespace
        conteudo_novo = re.sub(
            r'(namespace App\\Services;)',
            r'\1\n\nuse Illuminate\\Support\\Facades\\Log;',
            conteudo_novo
        )

# Escrever arquivo
try:
    with open(arquivo, 'w', encoding='utf-8') as f:
        f.write(conteudo_novo)
    print("✅ Arquivo atualizado!", file=sys.stderr)
except Exception as e:
    print(f"❌ Erro ao salvar: {e}", file=sys.stderr)
    sys.exit(1)
PYTHON_SCRIPT

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Verificação adicionada!"
    echo ""
    
    # Verificar sintaxe PHP
    echo "🔍 Verificando sintaxe PHP..."
    if php -l "$SERVICE_FILE" > /dev/null 2>&1; then
        echo "✅ Sintaxe PHP válida!"
    else
        echo "❌ Erro de sintaxe PHP!"
        php -l "$SERVICE_FILE"
        echo "🔄 Restaurando backup..."
        cp "$BACKUP_FILE" "$SERVICE_FILE"
        exit 1
    fi
    
    echo ""
    echo "✅ Correção aplicada com sucesso!"
    echo ""
    echo "🧪 Agora teste gerar um atestado novamente"
    echo "   Os logs mostrarão se o PDF está sendo criado ou qual é o erro"
else
    echo "❌ Erro ao aplicar correção"
    exit 1
fi

