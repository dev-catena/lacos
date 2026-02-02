#!/bin/bash

# Script para aplicar correção de hash_file no PrescriptionController
# Execute este script NO SERVIDOR onde está o backend Laravel

set -e

echo "🔧 Aplicando correção de hash_file no PrescriptionController..."
echo ""

# Tentar encontrar o diretório do projeto
PROJECT_DIR=""
POSSIBLE_PATHS=(
    "/var/www/lacos-backend"
    "$HOME/lacos-backend"
    "$(pwd)"
)

for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -d "$path" ] && [ -f "$path/artisan" ]; then
        PROJECT_DIR="$path"
        echo "✅ Projeto encontrado em: $PROJECT_DIR"
        break
    fi
done

if [ -z "$PROJECT_DIR" ]; then
    echo "❌ Não foi possível encontrar o projeto Laravel"
    exit 1
fi

cd "$PROJECT_DIR" || exit 1
echo "📂 Diretório atual: $(pwd)"
echo ""

CONTROLLER_FILE="app/Http/Controllers/Api/PrescriptionController.php"

if [ ! -f "$CONTROLLER_FILE" ]; then
    echo "❌ Arquivo PrescriptionController.php não encontrado!"
    exit 1
fi

# Criar backup
BACKUP_FILE="${CONTROLLER_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# Verificar se já tem a correção
if grep -q "if (!file_exists(\$fullSignedPath))" "$CONTROLLER_FILE"; then
    echo "✅ Correção já aplicada!"
    exit 0
fi

echo "🔍 Procurando código a ser corrigido..."
echo ""

# Usar Python para fazer a substituição
python3 << 'PYTHON_SCRIPT'
import re
import sys

arquivo = 'app/Http/Controllers/Api/PrescriptionController.php'

try:
    with open(arquivo, 'r', encoding='utf-8') as f:
        conteudo = f.read()
except Exception as e:
    print(f"❌ Erro ao ler arquivo: {e}", file=sys.stderr)
    sys.exit(1)

conteudo_original = conteudo

# Código novo com verificação
codigo_novo = """            // Gerar hash para validação - VERIFICAR SE ARQUIVO EXISTE PRIMEIRO
            $fullSignedPath = storage_path('app/' . $signedPdfPath);
            if (!file_exists($fullSignedPath)) {
                Log::error('Arquivo PDF assinado não encontrado: ' . $fullSignedPath);
                throw new \\Exception('Erro ao gerar atestado: arquivo PDF não foi criado corretamente. Verifique os logs para mais detalhes.');
            }

            $documentHash = hash_file('sha256', $fullSignedPath);

            // Se hash_file falhar, usar hash do conteúdo
            if ($documentHash === false) {
                Log::error('Erro ao calcular hash do PDF: ' . $fullSignedPath);
                $documentHash = hash('sha256', file_get_contents($fullSignedPath));
            }"""

# Procurar pelo padrão antigo
# Padrão: linha com hash_file que calcula hash do signedPdfPath
padrao_antigo = r'(\s+)// Gerar hash para validação\s+\$documentHash = hash_file\(\'sha256\', storage_path\(\'app/\' \. \$signedPdfPath\)\);'

def substituir_hash(match):
    indentacao = match.group(1)
    linhas_novo = codigo_novo.split('\n')
    linhas_ajustadas = []
    for linha in linhas_novo:
        if linha.strip():
            linhas_ajustadas.append(indentacao + linha.strip())
        else:
            linhas_ajustadas.append('')
    return '\n'.join(linhas_ajustadas)

# Tentar substituir
conteudo_novo = re.sub(padrao_antigo, substituir_hash, conteudo, flags=re.MULTILINE)

# Se não funcionou com regex, tentar substituição linha por linha
if conteudo_novo == conteudo_original:
    print("⚠️  Regex não funcionou, tentando substituição manual...", file=sys.stderr)
    linhas = conteudo.split('\n')
    resultado = []
    i = 0
    substituicoes = 0
    
    while i < len(linhas):
        linha = linhas[i]
        
        # Procurar linha que tem hash_file com signedPdfPath
        if 'hash_file' in linha and 'signedPdfPath' in linha and 'Gerar hash para validação' in (linhas[i-1] if i > 0 else ''):
            # Encontrar indentação
            indentacao = len(linha) - len(linha.lstrip())
            indent_str = ' ' * indentacao
            
            print(f"  ✏️  Substituindo ocorrência na linha {i+1}", file=sys.stderr)
            
            # Adicionar código novo
            for linha_nova in codigo_novo.split('\n'):
                if linha_nova.strip():
                    resultado.append(indent_str + linha_nova.strip())
                else:
                    resultado.append('')
            
            substituicoes += 1
            i += 1
            continue
        
        resultado.append(linha)
        i += 1
    
    conteudo_novo = '\n'.join(resultado)
    print(f"✅ {substituicoes} substituição(ões) realizada(s)", file=sys.stderr)

# Verificar se houve mudança
if conteudo_novo == conteudo_original:
    print("⚠️  Nenhuma substituição foi realizada", file=sys.stderr)
    print("   O código pode ter estrutura diferente ou já estar corrigido", file=sys.stderr)
    sys.exit(0)

# Verificar se Log está importado
if 'use Illuminate\\Support\\Facades\\Log;' not in conteudo_novo:
    print("➕ Adicionando import do Log...", file=sys.stderr)
    
    # Procurar onde adicionar
    padrao_import = r'(use Illuminate\\Support\\Facades\\[^;]+;)'
    matches = list(re.finditer(padrao_import, conteudo_novo))
    if matches:
        pos = matches[-1].end()
        conteudo_novo = conteudo_novo[:pos] + '\nuse Illuminate\\Support\\Facades\\Log;' + conteudo_novo[pos:]
        print("  ✅ Import do Log adicionado", file=sys.stderr)

# Escrever arquivo corrigido
try:
    with open(arquivo, 'w', encoding='utf-8') as f:
        f.write(conteudo_novo)
    print("✅ Arquivo corrigido salvo!", file=sys.stderr)
except Exception as e:
    print(f"❌ Erro ao salvar arquivo: {e}", file=sys.stderr)
    sys.exit(1)
PYTHON_SCRIPT

if [ $? -ne 0 ]; then
    echo "❌ Erro ao aplicar correção"
    echo "🔄 Restaurando backup..."
    cp "$BACKUP_FILE" "$CONTROLLER_FILE"
    exit 1
fi

# Verificar sintaxe PHP
echo ""
echo "🔍 Verificando sintaxe PHP..."
if php -l "$CONTROLLER_FILE" > /dev/null 2>&1; then
    echo "✅ Sintaxe PHP válida!"
else
    echo "❌ Erro de sintaxe PHP!"
    php -l "$CONTROLLER_FILE"
    echo "🔄 Restaurando backup..."
    cp "$BACKUP_FILE" "$CONTROLLER_FILE"
    exit 1
fi

# Limpar cache
echo ""
echo "🧹 Limpando cache do Laravel..."
php artisan config:clear > /dev/null 2>&1 || true
php artisan cache:clear > /dev/null 2>&1 || true
echo "✅ Cache limpo"

echo ""
echo "✅ Correção aplicada com sucesso!"
echo ""
echo "📋 O que foi alterado:"
echo "  - Adicionada verificação se arquivo existe antes de calcular hash"
echo "  - Adicionado tratamento de erro se hash_file falhar"
echo "  - Adicionado log de erros para debug"
echo ""
echo "📦 Backup salvo em: $BACKUP_FILE"
echo ""
echo "🧪 Para testar:"
echo "  1. Tente gerar um atestado novamente"
echo "  2. Se ainda der erro, verifique os logs:"
echo "     tail -f storage/logs/laravel.log"

