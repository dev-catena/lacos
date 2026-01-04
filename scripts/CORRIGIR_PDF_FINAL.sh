#!/bin/bash

cd /var/www/lacos-backend || exit 1

SERVICE_FILE="app/Services/PDFService.php"

echo "🔍 Verificando e limpando código duplicado..."
echo ""

# Backup
BACKUP_FILE="${SERVICE_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
sudo cp "$SERVICE_FILE" "$BACKUP_FILE"
echo "✅ Backup: $BACKUP_FILE"
echo ""

# Aplicar correção - remover duplicação e melhorar
sudo python3 << 'EOF'
arquivo = 'app/Services/PDFService.php'

with open(arquivo, 'r', encoding='utf-8') as f:
    conteudo = f.read()

# Remover a verificação duplicada (a segunda que vem depois de file_put_contents)
# Manter apenas a primeira verificação que já está bem feita

# Padrão: remover a segunda verificação duplicada
padrao_duplicado = r'(\s+// Verificar se o arquivo foi criado\s+\$fullPath = storage_path\(\'app/\' \. \$path\);\s+if \(!file_exists\(\$fullPath\)\) \{[^}]+\}\s+)(Log::info\(\'PDF criado com sucesso\')'

# Substituir removendo a duplicação
conteudo_novo = conteudo

# Método mais simples: remover a segunda verificação manualmente
linhas = conteudo.split('\n')
resultado = []
i = 0
dentro_verificacao_duplicada = False
ja_tem_verificacao = False

while i < len(linhas):
    linha = linhas[i]
    
    # Detectar início da verificação duplicada (segunda ocorrência)
    if '// Verificar se o arquivo foi criado' in linha and ja_tem_verificacao:
        dentro_verificacao_duplicada = True
        # Pular esta linha e as seguintes até o Log::info
        i += 1
        while i < len(linhas) and 'Log::info(\'PDF criado com sucesso\'' not in linhas[i]:
            i += 1
        # Agora estamos na linha do Log::info, vamos mantê-la
        resultado.append(linhas[i])
        dentro_verificacao_duplicada = False
        i += 1
        continue
    elif '// Verificar se o arquivo foi criado' in linha:
        ja_tem_verificacao = True
        resultado.append(linha)
    elif dentro_verificacao_duplicada:
        # Pular linhas dentro da verificação duplicada
        i += 1
        continue
    else:
        resultado.append(linha)
    
    i += 1

conteudo_novo = '\n'.join(resultado)

# Verificar se mudou
if conteudo_novo != conteudo:
    print("✅ Código duplicado removido!")
else:
    print("ℹ️  Nenhuma duplicação encontrada (ou já foi removida)")

with open(arquivo, 'w', encoding='utf-8') as f:
    f.write(conteudo_novo)

print("✅ Arquivo atualizado!")
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "🔍 Verificando sintaxe PHP..."
    if php -l "$SERVICE_FILE" > /dev/null 2>&1; then
        echo "✅ Sintaxe PHP válida!"
        echo ""
        echo "📋 Método após correção:"
        sed -n '/public function generateCertificatePDF/,/^    }/p' "$SERVICE_FILE" | tail -40
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

echo ""
echo "🔍 Verificando permissões do diretório:"
ls -la storage/app/ | grep temp || echo "⚠️  Diretório temp não existe"
echo ""
echo "📋 Criando diretório se não existir e ajustando permissões:"
sudo mkdir -p storage/app/temp
sudo chown -R www-data:www-data storage/app/temp
sudo chmod -R 755 storage/app/temp
echo "✅ Permissões ajustadas!"












