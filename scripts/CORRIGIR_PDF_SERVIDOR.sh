#!/bin/bash

cd /var/www/lacos-backend || exit 1

SERVICE_FILE="app/Services/PDFService.php"

echo "🔍 Verificando conteúdo do arquivo..."
echo ""

# Ver o método generateCertificatePDF
echo "📋 Método generateCertificatePDF:"
sed -n '/public function generateCertificatePDF/,/^    }/p' "$SERVICE_FILE"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar se já tem a verificação
if grep -q "Verificar se arquivo foi criado" "$SERVICE_FILE"; then
    echo "✅ Verificação já existe!"
    exit 0
fi

# Verificar como o PDF é salvo
echo "🔍 Procurando como o PDF é salvo:"
grep -n "Storage\|put\|save\|output" "$SERVICE_FILE" | grep -A 2 -B 2 "generateCertificatePDF" || grep -A 30 "function generateCertificatePDF" "$SERVICE_FILE" | grep -E "Storage|put|save|output"
echo ""

# Backup com sudo
BACKUP_FILE="${SERVICE_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
sudo cp "$SERVICE_FILE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# Aplicar correção com sudo
sudo python3 << 'EOF'
import re

arquivo = 'app/Services/PDFService.php'

with open(arquivo, 'r', encoding='utf-8') as f:
    conteudo = f.read()

# Verificar se tem Storage::put
if 'Storage::put' not in conteudo:
    print("⚠️  Storage::put não encontrado. Verificando alternativas...")
    print("\n📋 Conteúdo do método generateCertificatePDF:")
    linhas = conteudo.split('\n')
    no_metodo = False
    for i, linha in enumerate(linhas):
        if 'function generateCertificatePDF' in linha:
            no_metodo = True
        if no_metodo:
            print(f"{i+1}: {linha}")
            if linha.strip() == '}' and no_metodo:
                break
    exit(1)

# Tentar diferentes padrões
padroes = [
    (r'(Storage::put\(\$path, \$pdf->output\(\)\);\s*\n\s*)(return \$path;)', 'padrão 1'),
    (r'(Storage::put\(\$path, \$pdf->output\(\)\);\s*\n)(\s*return \$path;)', 'padrão 2'),
    (r'(Storage::put\([^)]+\);\s*\n\s*)(return)', 'padrão 3'),
]

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

conteudo_novo = None
for padrao, nome in padroes:
    conteudo_novo = re.sub(padrao, substituicao, conteudo)
    if conteudo_novo != conteudo:
        print(f"✅ Padrão encontrado: {nome}")
        break

if conteudo_novo is None or conteudo_novo == conteudo:
    # Método alternativo: linha por linha
    print("⚠️  Usando método alternativo (linha por linha)...")
    linhas = conteudo.split('\n')
    resultado = []
    encontrado = False
    
    for i, linha in enumerate(linhas):
        resultado.append(linha)
        
        # Procurar Storage::put com variações
        if 'Storage::put' in linha and '$pdf->output()' in linha:
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
            # Manter o return original
            pass
    
    if encontrado:
        conteudo_novo = '\n'.join(resultado)
    else:
        print("❌ Não foi possível encontrar o padrão Storage::put")
        exit(1)

with open(arquivo, 'w', encoding='utf-8') as f:
    f.write(conteudo_novo)

print("✅ Verificação adicionada!")
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "🔍 Verificando sintaxe PHP..."
    if php -l "$SERVICE_FILE" > /dev/null 2>&1; then
        echo "✅ Sintaxe PHP válida!"
        echo "✅ Correção aplicada!"
        echo ""
        echo "📋 Verificando resultado:"
        sed -n '/public function generateCertificatePDF/,/^    }/p' "$SERVICE_FILE" | tail -30
    else
        echo "❌ Erro de sintaxe! Restaurando backup..."
        sudo cp "$BACKUP_FILE" "$SERVICE_FILE"
        php -l "$SERVICE_FILE"
        exit 1
    fi
else
    echo "❌ Erro ao aplicar correção"
    exit 1
fi





