#!/bin/bash

# Script para aplicar correção de validação de grupo para médicos
# Este script será enviado para o servidor e executado lá

set -e  # Parar em caso de erro

echo "🔧 Aplicando correção de validação de acesso ao grupo para médicos..."
echo ""

# Definir caminhos
CONTROLLER_FILE="app/Http/Controllers/Api/PrescriptionController.php"
BACKUP_DIR="/tmp/backups_prescription_$(date +%Y%m%d_%H%M%S)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Verificar se estamos no diretório correto
if [ ! -f "$CONTROLLER_FILE" ]; then
    echo "⚠️  Arquivo PrescriptionController.php não encontrado!"
    echo "📂 Procurando em outros locais..."
    
    # Tentar encontrar o arquivo
    POSSIBLE_PATHS=(
        "backend-laravel/$CONTROLLER_FILE"
        "/var/www/lacos-backend/$CONTROLLER_FILE"
        "$HOME/lacos-backend/$CONTROLLER_FILE"
        "/var/www/html/$CONTROLLER_FILE"
    )
    
    for path in "${POSSIBLE_PATHS[@]}"; do
        if [ -f "$path" ]; then
            CONTROLLER_FILE="$path"
            echo "✅ Encontrado em: $CONTROLLER_FILE"
            break
        fi
    done
    
    if [ ! -f "$CONTROLLER_FILE" ]; then
        echo "❌ Arquivo não encontrado. Por favor, navegue até o diretório do projeto Laravel."
        exit 1
    fi
fi

# Criar backup
echo "📦 Criando backup..."
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/PrescriptionController.php.backup"
cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# Verificar se o arquivo tem o código antigo
if ! grep -q "Verificar se o usuário pertence ao grupo" "$CONTROLLER_FILE"; then
    echo "⚠️  Não foi encontrado o código antigo no arquivo."
    echo "💡 O arquivo pode já estar corrigido ou ter uma estrutura diferente."
    echo "📝 Verificando conteúdo do arquivo..."
    echo ""
    exit 1
fi

# Adicionar import do DB se não existir
echo "🔍 Verificando import do DB..."
if ! grep -q "use Illuminate\\Support\\Facades\\DB;" "$CONTROLLER_FILE"; then
    echo "➕ Adicionando import do DB..."
    # Adicionar após os outros imports do Illuminate\Support\Facades
    sed -i '/^use Illuminate\\Support\\Facades\\/a use Illuminate\\Support\\Facades\\DB;' "$CONTROLLER_FILE"
    echo "✅ Import do DB adicionado"
else
    echo "✅ Import do DB já existe"
fi
echo ""

# Função para substituir a validação
substituir_validacao() {
    local METODO=$1
    echo "🔧 Corrigindo método: $METODO"
    
    # Criar arquivo temporário com o código novo
    cat > /tmp/nova_validacao.php << 'NOVOCODIGO'
// Verificar acesso ao grupo
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
}
NOVOCODIGO

    # Usar Python para fazer a substituição de forma mais segura
    python3 << PYTHON_SCRIPT
import re
import sys

# Ler o arquivo
with open('$CONTROLLER_FILE', 'r', encoding='utf-8') as f:
    content = f.read()

# Ler o código novo
with open('/tmp/nova_validacao.php', 'r', encoding='utf-8') as f:
    novo_codigo = f.read()

# Padrão para encontrar o bloco antigo
# Procurar pelo comentário e todo o bloco até o fechamento
padrao = r'// Verificar se o usuário pertence ao grupo\s+\$group = \$user->groups\(\)->find\(\$validated\[\'group_id\'\]\);\s+if \(!\$group\) \{\s+return response\(\)->json\(\[\s+\'success\' => false,\s+\'message\' => \'Você não tem acesso a este grupo\',\s+\], 403\);\s+\}'

# Substituir
novo_conteudo = re.sub(padrao, novo_codigo, content, flags=re.DOTALL)

# Se não encontrou com regex complexa, tentar método mais simples
if novo_conteudo == content:
    # Procurar linha por linha e substituir
    linhas = content.split('\n')
    novo_linhas = []
    i = 0
    substituindo = False
    while i < len(linhas):
        linha = linhas[i]
        if '// Verificar se o usuário pertence ao grupo' in linha:
            # Começar substituição
            novo_linhas.extend(novo_codigo.split('\n'))
            substituindo = True
            # Pular linhas até encontrar o fechamento do if
            i += 1
            nivel = 0
            while i < len(linhas):
                if '{' in linhas[i]:
                    nivel += linhas[i].count('{')
                if '}' in linhas[i]:
                    nivel -= linhas[i].count('}')
                i += 1
                if nivel <= 0:
                    break
            continue
        if not substituindo:
            novo_linhas.append(linha)
        i += 1
    novo_conteudo = '\n'.join(novo_linhas)

# Escrever de volta
with open('$CONTROLLER_FILE', 'w', encoding='utf-8') as f:
    f.write(novo_conteudo)

print("Substituição concluída")
PYTHON_SCRIPT

    if [ $? -eq 0 ]; then
        echo "✅ Método $METODO corrigido"
    else
        echo "❌ Erro ao corrigir método $METODO"
        return 1
    fi
}

# Corrigir ambos os métodos usando sed (método mais simples e confiável)
echo "🔧 Aplicando correções..."

# Criar script Python mais robusto
python3 << 'PYTHON_SCRIPT'
import re

# Ler o arquivo
with open('$CONTROLLER_FILE', 'r', encoding='utf-8') as f:
    content = f.read()

# Código novo
novo_codigo = """// Verificar acesso ao grupo
            \$user = Auth::user();
            \$isDoctor = \$user->profile === 'doctor';

            if (\$isDoctor) {
                // Para médicos: verificar se tem consulta com o grupo/paciente
                \$hasAppointment = DB::table('appointments')
                    ->where('doctor_id', \$user->id)
                    ->where('group_id', \$validated['group_id'])
                    ->exists();
                
                // Se não tem consulta geral, verificar se tem a consulta específica
                if (!\$hasAppointment && (\$validated['appointment_id'] ?? null)) {
                    \$appointment = DB::table('appointments')
                        ->where('id', \$validated['appointment_id'])
                        ->where('doctor_id', \$user->id)
                        ->where('group_id', \$validated['group_id'])
                        ->first();
                    
                    if (!\$appointment) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Você não tem permissão para gerar documentos para esta consulta.',
                        ], 403);
                    }
                } elseif (!\$hasAppointment) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Você não tem consultas agendadas com este paciente/grupo.',
                    ], 403);
                }
            } else {
                // Para não-médicos (cuidadores): verificar se pertence ao grupo
                \$group = \$user->groups()->find(\$validated['group_id']);
                if (!\$group) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Você não tem acesso a este grupo',
                    ], 403);
                }
            }"""

# Padrão para encontrar o bloco antigo (com espaçamento flexível)
padrao = r'// Verificar se o usuário pertence ao grupo\s+\$group = \$user->groups\(\)->find\(\$validated\[\'group_id\'\]\);\s+if \(!\$group\) \{\s+return response\(\)->json\(\[\s+\'success\' => false,\s+\'message\' => \'Você não tem acesso a este grupo\',\s+\], 403\);\s+\}'

# Substituir todas as ocorrências
novo_content = re.sub(padrao, novo_codigo, content, flags=re.DOTALL)

# Se não encontrou, tentar método manual linha por linha
if novo_content == content:
    linhas = content.split('\n')
    resultado = []
    i = 0
    while i < len(linhas):
        if '// Verificar se o usuário pertence ao grupo' in linhas[i]:
            # Adicionar código novo
            resultado.extend(novo_codigo.split('\n'))
            # Pular as linhas antigas
            i += 1
            while i < len(linhas) and not (linhas[i].strip().startswith('//') and 'Buscar médico' in linhas[i]):
                if '}' in linhas[i] and not linhas[i].strip().startswith('//'):
                    # Verificar se é o fechamento do if
                    i += 1
                    break
                i += 1
            continue
        resultado.append(linhas[i])
        i += 1
    novo_content = '\n'.join(resultado)

# Escrever resultado
with open('$CONTROLLER_FILE', 'w', encoding='utf-8') as f:
    f.write(novo_content)

print("✅ Correção aplicada")
PYTHON_SCRIPT

echo ""

# Verificar sintaxe PHP
echo "🔍 Verificando sintaxe PHP..."
if php -l "$CONTROLLER_FILE" > /dev/null 2>&1; then
    echo "✅ Sintaxe PHP válida!"
else
    echo "❌ Erro de sintaxe PHP encontrado!"
    echo "🔄 Restaurando backup..."
    cp "$BACKUP_FILE" "$CONTROLLER_FILE"
    exit 1
fi

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
echo "🚀 Próximos passos:"
echo "  1. Testar geração de atestado/receita como médico"
echo "  2. Verificar logs em caso de erro"
echo "  3. Limpar cache: php artisan optimize:clear"
echo ""


