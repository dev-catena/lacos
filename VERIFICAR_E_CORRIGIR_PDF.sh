#!/bin/bash

# Script para verificar e corrigir PDFService.php no servidor

cd /var/www/lacos-backend || exit 1

SERVICE_FILE="app/Services/PDFService.php"

echo "🔍 Verificando arquivo PDFService.php..."
echo ""

# Verificar se arquivo existe
if [ ! -f "$SERVICE_FILE" ]; then
    echo "❌ Arquivo não encontrado: $SERVICE_FILE"
    exit 1
fi

# Verificar se já tem a verificação
if grep -q "Verificar se arquivo foi criado" "$SERVICE_FILE"; then
    echo "✅ Verificação já existe no arquivo!"
    echo ""
    echo "📋 Verificando método generateCertificatePDF:"
    grep -A 40 "function generateCertificatePDF" "$SERVICE_FILE" | head -50
    exit 0
fi

echo "📋 Conteúdo atual do método generateCertificatePDF:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
sed -n '/public function generateCertificatePDF/,/^    }/p' "$SERVICE_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar se tem Storage::put
if ! grep -q "Storage::put" "$SERVICE_FILE"; then
    echo "⚠️  Não encontrado Storage::put no arquivo"
    echo "📋 Verificando como o PDF é salvo:"
    grep -A 20 "function generateCertificatePDF" "$SERVICE_FILE"
    exit 1
fi

echo "🔧 Aplicando correção..."
echo ""

# Backup
BACKUP_FILE="${SERVICE_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$SERVICE_FILE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# Aplicar correção usando Python
python3 << 'PYTHON_SCRIPT'
import re

arquivo = 'app/Services/PDFService.php'

with open(arquivo, 'r', encoding='utf-8') as f:
    conteudo = f.read()

# Padrão: Storage::put seguido de return $path (pode ter linhas vazias entre)
padrao = r'(Storage::put\(\$path, \$pdf->output\(\)\);\s*\n\s*)(return \$path;)'

substituicao = r'''\1
            // Verificar se arquivo foi criado
            $fullPath = storage_path('app/' . $path);
            if (!file_exists($fullPath)) {
                Log::error('Erro: PDF não foi criado após Storage::put()', [
                    'path' => $path,
                    'fullPath' => $fullPath,
                    'directory_exists' => is_dir(dirname($fullPath)),
                    'directory_writable' => is_writable(dirname($fullPath)),
                    'disk_free_space' => disk_free_space(dirname($fullPath)),
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

if conteudo_novo == conteudo:
    print("⚠️  Padrão não encontrado. Tentando método alternativo...")
    # Tentar método alternativo: procurar linha por linha
    linhas = conteudo.split('\n')
    resultado = []
    i = 0
    encontrado = False
    
    while i < len(linhas):
        linha = linhas[i]
        resultado.append(linha)
        
        # Procurar Storage::put
        if 'Storage::put($path, $pdf->output());' in linha:
            # Adicionar verificação após esta linha
            resultado.append('')
            resultado.append('            // Verificar se arquivo foi criado')
            resultado.append('            $fullPath = storage_path(\'app/\' . $path);')
            resultado.append('            if (!file_exists($fullPath)) {')
            resultado.append('                Log::error(\'Erro: PDF não foi criado após Storage::put()\', [')
            resultado.append('                    \'path\' => $path,')
            resultado.append('                    \'fullPath\' => $fullPath,')
            resultado.append('                    \'directory_exists\' => is_dir(dirname($fullPath)),')
            resultado.append('                    \'directory_writable\' => is_writable(dirname($fullPath)),')
            resultado.append('                    \'disk_free_space\' => disk_free_space(dirname($fullPath)),')
            resultado.append('                ]);')
            resultado.append('                throw new \\Exception(\'Erro ao salvar PDF: arquivo não foi criado em \' . $fullPath);')
            resultado.append('            }')
            resultado.append('')
            resultado.append('            Log::info(\'PDF criado com sucesso\', [')
            resultado.append('                \'path\' => $path,')
            resultado.append('                \'fullPath\' => $fullPath,')
            resultado.append('                \'size\' => filesize($fullPath),')
            resultado.append('            ]);')
            resultado.append('')
            encontrado = True
        elif encontrado and 'return $path;' in linha:
            # Remover return $path; duplicado se já foi adicionado
            pass
        
        i += 1
    
    if encontrado:
        conteudo_novo = '\n'.join(resultado)
    else:
        print("❌ Não foi possível encontrar o padrão para substituição")
        exit(1)

with open(arquivo, 'w', encoding='utf-8') as f:
    f.write(conteudo_novo)

print("✅ Verificação adicionada!")
PYTHON_SCRIPT

if [ $? -eq 0 ]; then
    echo ""
    echo "🔍 Verificando sintaxe PHP..."
    if php -l "$SERVICE_FILE" > /dev/null 2>&1; then
        echo "✅ Sintaxe PHP válida!"
        echo ""
        echo "✅ Correção aplicada com sucesso!"
        echo ""
        echo "📋 Método generateCertificatePDF após correção:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        sed -n '/public function generateCertificatePDF/,/^    }/p' "$SERVICE_FILE" | tail -40
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    else
        echo "❌ Erro de sintaxe PHP!"
        php -l "$SERVICE_FILE"
        echo ""
        echo "🔄 Restaurando backup..."
        cp "$BACKUP_FILE" "$SERVICE_FILE"
        exit 1
    fi
else
    echo "❌ Erro ao aplicar correção"
    exit 1
fi



