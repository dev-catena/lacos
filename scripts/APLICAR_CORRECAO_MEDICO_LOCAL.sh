#!/bin/bash

# Script para aplicar correção de validação de grupo para médicos
# Execute este script NO SERVIDOR onde está o backend Laravel

set -e

echo "🔧 Aplicando correção de validação de acesso ao grupo para médicos..."
echo ""

# Tentar encontrar o arquivo do controller
CONTROLLER_FILE=""
POSSIBLE_PATHS=(
    "/var/www/lacos-backend/app/Http/Controllers/Api/PrescriptionController.php"
    "$HOME/lacos-backend/app/Http/Controllers/Api/PrescriptionController.php"
    "$(pwd)/app/Http/Controllers/Api/PrescriptionController.php"
    "app/Http/Controllers/Api/PrescriptionController.php"
)

for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -f "$path" ]; then
        CONTROLLER_FILE="$path"
        echo "✅ Arquivo encontrado: $CONTROLLER_FILE"
        break
    fi
done

if [ -z "$CONTROLLER_FILE" ]; then
    echo "❌ Não foi possível encontrar PrescriptionController.php"
    echo "📂 Procurando..."
    find /var/www -name "PrescriptionController.php" 2>/dev/null | head -5
    exit 1
fi

cd "$(dirname "$CONTROLLER_FILE")/../../../../" || exit 1
CONTROLLER_RELATIVE="app/Http/Controllers/Api/PrescriptionController.php"

echo "📂 Diretório do projeto: $(pwd)"
echo ""

# Criar backup
BACKUP_FILE="${CONTROLLER_RELATIVE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$CONTROLLER_RELATIVE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# Verificar se já está corrigido
if grep -q "\$isDoctor = \$user->profile" "$CONTROLLER_RELATIVE"; then
    echo "⚠️  O arquivo parece já estar corrigido (contém \$isDoctor)"
    echo "📋 Verificando se há código antigo..."
    if grep -q "// Verificar se o usuário pertence ao grupo" "$CONTROLLER_RELATIVE"; then
        echo "⚠️  Encontrado código antigo misturado com novo. Aplicando correção completa..."
    else
        echo "✅ O arquivo já está completamente corrigido!"
        exit 0
    fi
fi

echo "🔧 Aplicando correção..."
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

# Código novo (com indentação correta)
codigo_novo = """            // Verificar acesso ao grupo
            $user = Auth::user();
            $isDoctor = $user->profile === 'doctor';

            if ($isDoctor) {
                // Para médicos: verificar se tem consulta com o grupo/paciente
                $hasAppointment = DB::table('appointments')
                    ->where('doctor_id', $user->id)
                    ->where('group_id', $validated['group_id'])
                    ->exists();
                
                // Se não tem consulta geral, verificar se tem a consulta específica
                if (!$hasAppointment && ($validated['appointment_id'] ?? null)) {
                    $appointment = DB::table('appointments')
                        ->where('id', $validated['appointment_id'])
                        ->where('doctor_id', $user->id)
                        ->where('group_id', $validated['group_id'])
                        ->first();
                    
                    if (!$appointment) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Você não tem permissão para gerar documentos para esta consulta.',
                        ], 403);
                    }
                } elseif (!$hasAppointment) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Você não tem consultas agendadas com este paciente/grupo.',
                    ], 403);
                }
            } else {
                // Para não-médicos (cuidadores): verificar se pertence ao grupo
                $group = $user->groups()->find($validated['group_id']);
                if (!$group) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Você não tem acesso a este grupo',
                    ], 403);
                }
            }"""

# Padrão para encontrar o código antigo
padrao_antigo = r'(\s+)// Verificar se o usuário pertence ao grupo\s+\$group = \$user->groups\(\)->find\(\$validated\[\'group_id\'\]\);\s+if \(!\$group\) \{\s+return response\(\)->json\(\[[^\]]+\'Você não tem acesso a este grupo\'[^\]]+\], 403\);\s+\}'

def substituir_bloco(match):
    indentacao = match.group(1)
    # Ajustar indentação do código novo para corresponder
    linhas_novo = codigo_novo.split('\n')
    linhas_ajustadas = []
    for linha in linhas_novo:
        if linha.strip():  # Se não for linha vazia
            linhas_ajustadas.append(indentacao + linha.strip())
        else:
            linhas_ajustadas.append('')
    return '\n'.join(linhas_ajustadas)

# Tentar substituir usando regex
conteudo_novo = re.sub(padrao_antigo, substituir_bloco, conteudo, flags=re.MULTILINE | re.DOTALL)

# Se não funcionou com regex, tentar substituição manual linha por linha
if conteudo_novo == conteudo:
    print("⚠️  Regex não funcionou, tentando substituição manual...", file=sys.stderr)
    linhas = conteudo.split('\n')
    resultado = []
    i = 0
    substituicoes = 0
    
    while i < len(linhas):
        linha = linhas[i]
        
        if '// Verificar se o usuário pertence ao grupo' in linha:
            # Encontrar indentação
            indentacao = len(linha) - len(linha.lstrip())
            indent_str = ' ' * indentacao
            
            print(f"  ✏️  Substituindo ocorrência #{substituicoes + 1} na linha {i+1}", file=sys.stderr)
            
            # Adicionar código novo com indentação correta
            for linha_nova in codigo_novo.split('\n'):
                if linha_nova.strip():
                    resultado.append(indent_str + linha_nova.strip())
                else:
                    resultado.append('')
            
            substituicoes += 1
            
            # Pular linhas antigas (até o fechamento do if)
            i += 1
            nivel = 0
            dentro = False
            while i < len(linhas):
                linha_atual = linhas[i]
                if '{' in linha_atual:
                    nivel += linha_atual.count('{')
                    dentro = True
                if '}' in linha_atual:
                    nivel -= linha_atual.count('}')
                    if dentro and nivel <= 0:
                        i += 1
                        break
                i += 1
            continue
        
        resultado.append(linha)
        i += 1
    
    conteudo_novo = '\n'.join(resultado)
    print(f"✅ {substituicoes} substituição(ões) realizada(s)", file=sys.stderr)

# Adicionar import do DB se não existir
if 'use Illuminate\\Support\\Facades\\DB;' not in conteudo_novo:
    print("➕ Adicionando import do DB...", file=sys.stderr)
    
    # Procurar último import do Facades
    padrao_import = r'(use Illuminate\\Support\\Facades\\[^;]+;)'
    matches = list(re.finditer(padrao_import, conteudo_novo))
    if matches:
        pos = matches[-1].end()
        conteudo_novo = conteudo_novo[:pos] + '\nuse Illuminate\\Support\\Facades\\DB;' + conteudo_novo[pos:]
    else:
        # Adicionar após namespace
        match = re.search(r'(namespace App\\Http\\Controllers\\Api;)', conteudo_novo)
        if match:
            pos = match.end()
            conteudo_novo = conteudo_novo[:pos] + '\n\nuse Illuminate\\Support\\Facades\\DB;' + conteudo_novo[pos:]

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
    cp "$BACKUP_FILE" "$CONTROLLER_RELATIVE"
    exit 1
fi

# Verificar sintaxe PHP
echo ""
echo "🔍 Verificando sintaxe PHP..."
if php -l "$CONTROLLER_RELATIVE" > /dev/null 2>&1; then
    echo "✅ Sintaxe PHP válida!"
else
    echo "❌ Erro de sintaxe PHP!"
    php -l "$CONTROLLER_RELATIVE"
    echo "🔄 Restaurando backup..."
    cp "$BACKUP_FILE" "$CONTROLLER_RELATIVE"
    exit 1
fi

# Limpar cache
echo ""
echo "🧹 Limpando cache do Laravel..."
php artisan optimize:clear > /dev/null 2>&1 || true
echo "✅ Cache limpo"

echo ""
echo "✅ Correção aplicada com sucesso!"
echo ""
echo "📋 O que foi alterado:"
echo "  - Médicos agora verificam acesso através de consultas (appointments)"
echo "  - Cuidadores/pacientes continuam verificando acesso através de grupos"
echo "  - Adicionada validação específica para consultas individuais"
echo ""
echo "📦 Backup salvo em: $BACKUP_FILE"
echo ""
echo "🧪 Para testar:"
echo "  1. Tente gerar um atestado como médico"
echo "  2. O erro 'Você não tem acesso a este grupo' não deve mais aparecer"
echo "  3. Se aparecer outro erro, verifique se a consulta existe no banco de dados"

