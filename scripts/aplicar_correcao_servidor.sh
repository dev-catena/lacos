#!/bin/bash

set -e

echo "🔧 Aplicando correção de validação de acesso ao grupo para médicos..." 1>&2
echo "" 1>&2

# Definir caminhos
CONTROLLER_FILE="app/Http/Controllers/Api/PrescriptionController.php"

# Tentar diferentes caminhos base
POSSIBLE_BASES=(
    "/var/www/lacos-backend"
    "$HOME/lacos-backend"
    "/var/www/html"
)

BASE_PATH=""
for base in "${POSSIBLE_BASES[@]}"; do
    if [ -f "$base/$CONTROLLER_FILE" ]; then
        BASE_PATH="$base"
        echo "✅ Projeto encontrado em: $BASE_PATH" 1>&2
        break
    fi
done

if [ -z "$BASE_PATH" ]; then
    echo "❌ Não foi possível encontrar o projeto Laravel" 1>&2
    echo "📂 Procurando PrescriptionController.php..." 1>&2
    find /var/www -name "PrescriptionController.php" 2>/dev/null | head -5
    exit 1
fi

cd "$BASE_PATH" || exit 1
echo "📂 Diretório atual: $(pwd)" 1>&2
echo "" 1>&2

# Criar backup (com sudo se necessário)
BACKUP_DIR="/tmp/backups_prescription_$(date +%Y%m%d_%H%M%S)"
sudo mkdir -p "$BACKUP_DIR" 2>/dev/null || mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/PrescriptionController.php"
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE" 2>/dev/null || cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE" 1>&2
echo "" 1>&2

echo "🔍 Verificando arquivo atual..." 1>&2
if ! sudo grep -q "Verificar se o usuário pertence ao grupo" "$CONTROLLER_FILE" 2>/dev/null && ! grep -q "Verificar se o usuário pertence ao grupo" "$CONTROLLER_FILE"; then
    echo "⚠️  Código antigo não encontrado. Verificando se já está corrigido..." 1>&2
    if (sudo grep -q "\$isDoctor = \$user->profile" "$CONTROLLER_FILE" 2>/dev/null) || grep -q "\$isDoctor = \$user->profile" "$CONTROLLER_FILE"; then
        echo "✅ O arquivo já está corrigido!" 1>&2
        exit 0
    else
        echo "❌ Estrutura do arquivo diferente do esperado" 1>&2
        exit 1
    fi
fi

echo "🔧 Aplicando correção com Python..." 1>&2
python3 << 'PYTHON_INLINE'
import re
import sys

arquivo = 'app/Http/Controllers/Api/PrescriptionController.php'

print(f"📖 Lendo arquivo: {arquivo}", file=sys.stderr)
sys.stderr.flush()

# Tentar ler com sudo se necessário
try:
    with open(arquivo, 'r', encoding='utf-8') as f:
        conteudo = f.read()
except PermissionError:
    import subprocess
    result = subprocess.run(['sudo', 'cat', arquivo], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"❌ Erro ao ler arquivo: {result.stderr}", file=sys.stderr)
        sys.exit(1)
    conteudo = result.stdout

conteudo_original = conteudo
tamanho_original = len(conteudo)

print(f"📏 Tamanho original: {tamanho_original} caracteres", file=sys.stderr)
sys.stderr.flush()

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

print("🔄 Processando substituições...", file=sys.stderr)
sys.stderr.flush()

# Contar quantas vezes precisa substituir
ocorrencias_antigas = conteudo.count('// Verificar se o usuário pertence ao grupo')
print(f"🔍 Encontradas {ocorrencias_antigas} ocorrência(s) do código antigo", file=sys.stderr)
sys.stderr.flush()

# Substituir todas as ocorrências
linhas = conteudo.split('\n')
resultado = []
i = 0
substituicoes = 0

while i < len(linhas):
    linha = linhas[i]
    
    if '// Verificar se o usuário pertence ao grupo' in linha:
        print(f"  ✏️  Substituindo ocorrência #{substituicoes + 1} na linha {i+1}", file=sys.stderr)
        sys.stderr.flush()
        
        resultado.extend(codigo_novo.split('\n'))
        substituicoes += 1
        
        # Pular linhas antigas até encontrar o fechamento do if
        i += 1
        nivel = 0
        dentro = False
        linhas_puladas = 0
        
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
            linhas_puladas += 1
        
        print(f"    ⏭️  Puladas {linhas_puladas} linhas", file=sys.stderr)
        sys.stderr.flush()
        continue
    
    resultado.append(linha)
    i += 1

conteudo_novo = '\n'.join(resultado)

print(f"✅ {substituicoes} substituição(ões) realizada(s)", file=sys.stderr)
sys.stderr.flush()

# Adicionar import do DB se não existir
if 'use Illuminate\\Support\\Facades\\DB;' not in conteudo_novo:
    print("➕ Adicionando import do DB...", file=sys.stderr)
    sys.stderr.flush()
    
    # Procurar último import do Facades
    padrao = r'(use Illuminate\\Support\\Facades\\[^;]+;)'
    matches = list(re.finditer(padrao, conteudo_novo))
    if matches:
        pos = matches[-1].end()
        conteudo_novo = conteudo_novo[:pos] + '\nuse Illuminate\\Support\\Facades\\DB;' + conteudo_novo[pos:]
        print("  ✅ Import adicionado após outros imports do Facades", file=sys.stderr)
    else:
        # Adicionar após namespace
        match = re.search(r'(namespace App\\Http\\Controllers\\Api;)', conteudo_novo)
        if match:
            pos = match.end()
            conteudo_novo = conteudo_novo[:pos] + '\n\nuse Illuminate\\Support\\Facades\\DB;' + conteudo_novo[pos:]
            print("  ✅ Import adicionado após namespace", file=sys.stderr)
    sys.stderr.flush()
else:
    print("✅ Import do DB já existe", file=sys.stderr)
    sys.stderr.flush()

# Verificar se houve mudança
if conteudo_novo == conteudo_original:
    if '$isDoctor = $user->profile' in conteudo_novo:
        print("✅ Arquivo já está corrigido!", file=sys.stderr)
        sys.exit(0)
    else:
        print("❌ Nenhuma substituição foi realizada", file=sys.stderr)
        sys.exit(1)

# Escrever arquivo corrigido em /tmp (onde temos permissão)
print("💾 Salvando arquivo corrigido em /tmp...", file=sys.stderr)
sys.stderr.flush()

import tempfile
import os

# Criar arquivo temporário em /tmp
with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', delete=False, suffix='.php', dir='/tmp') as f:
    temp_file = f.name
    f.write(conteudo_novo)

# Imprimir o caminho do arquivo temporário para o shell capturar
print(f"TEMP_FILE:{temp_file}", file=sys.stdout)
sys.stdout.flush()

tamanho_novo = len(conteudo_novo)
print(f"✅ Arquivo temporário criado. Novo tamanho: {tamanho_novo} caracteres", file=sys.stderr)
sys.stderr.flush()
PYTHON_INLINE

if [ $? -ne 0 ]; then
    echo "❌ Erro ao aplicar correção" 1>&2
    echo "🔄 Restaurando backup..." 1>&2
    cp "$BACKUP_FILE" "$CONTROLLER_FILE"
    exit 1
fi

echo "" 1>&2
echo "🔍 Verificando sintaxe PHP..." 1>&2

if php -l "$CONTROLLER_FILE" > /dev/null 2>&1; then
    echo "✅ Sintaxe PHP válida!" 1>&2
else
    echo "❌ Erro de sintaxe PHP!" 1>&2
    echo "🔄 Restaurando backup..." 1>&2
    cp "$BACKUP_FILE" "$CONTROLLER_FILE"
    exit 1
fi

# Limpar cache
echo "" 1>&2
echo "🧹 Limpando cache do Laravel..." 1>&2
php artisan optimize:clear > /dev/null 2>&1 || true
echo "✅ Cache limpo" 1>&2

echo "" 1>&2
echo "✅ Correção aplicada com sucesso!" 1>&2
echo "" 1>&2
echo "📋 O que foi alterado:" 1>&2
echo "  - Médicos agora verificam acesso através de consultas (appointments)" 1>&2
echo "  - Cuidadores/pacientes continuam verificando acesso através de grupos" 1>&2
echo "  - Adicionada validação específica para consultas individuais" 1>&2
echo "" 1>&2
echo "📦 Backup salvo em: $BACKUP_FILE" 1>&2


