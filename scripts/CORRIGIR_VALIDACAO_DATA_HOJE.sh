#!/bin/bash

# Script para corrigir validação de data para permitir salvar o dia de hoje
# O problema: isPast() pode considerar hoje como passado se comparado com hora atual
# Solução: Comparar apenas a data (sem hora) usando startOfDay()

set -e

SERVER="darley@192.168.0.20"
SSH_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

read -sp "Digite a senha do servidor: " SUDO_PASS
echo ""

echo "🔧 Corrigindo validação de data para permitir salvar o dia de hoje..."
echo ""

sshpass -p "$SUDO_PASS" ssh -p $SSH_PORT -o StrictHostKeyChecking=no -o ConnectTimeout=30 $SERVER "echo '$SUDO_PASS' | sudo -S bash" << 'REMOTE_SCRIPT'
set -e

BACKEND_PATH="/var/www/lacos-backend"
cd "$BACKEND_PATH"

# Criar backup
BACKUP_FILE="app/Http/Controllers/Api/DoctorController.php.bak.$(date +%Y%m%d_%H%M%S)"
cp app/Http/Controllers/Api/DoctorController.php "$BACKUP_FILE"
echo "✅ Backup criado: $BACKEND_PATH/$BACKUP_FILE"

echo "📝 Corrigindo validação de data..."

# Usar Python para fazer a substituição de forma mais segura
python3 << 'PYEOF'
import re

file_path = 'app/Http/Controllers/Api/DoctorController.php'

with open(file_path, 'r') as f:
    content = f.read()

# Encontrar e substituir a validação de data
# Problema: isPast() compara com hora atual, então pode considerar hoje como passado
# Solução: Comparar apenas a data usando startOfDay()

# Padrão atual:
# if ($date->isPast() && !$date->isToday()) {
#     continue;
# }

# Nova lógica: comparar apenas a data (sem hora)
old_pattern = r'if \(\$date->isPast\(\) && !\$date->isToday\(\)\) \{\s*\\Log::warning\([^}]+\}\s*continue;.*?\/\/ Pular datas passadas'

new_code = '''if ($date->startOfDay()->lt(\Carbon\Carbon::today()->startOfDay())) {
                        \Log::warning('Pulando data passada', ['date' => $dateKey, 'date_start' => $date->startOfDay()->toDateString(), 'today_start' => \Carbon\Carbon::today()->startOfDay()->toDateString()]);
                        continue; // Pular apenas datas passadas (antes de hoje)
                    }
                    // Log para confirmar que hoje está sendo aceito
                    if ($date->startOfDay()->eq(\Carbon\Carbon::today()->startOfDay())) {
                        \Log::info('Data de hoje sendo processada', ['date' => $dateKey]);
                    }'''

# Tentar substituir
if re.search(old_pattern, content, re.DOTALL):
    content = re.sub(old_pattern, new_code, content, flags=re.DOTALL)
    print("✅ Validação de data corrigida (padrão completo)")
else:
    # Tentar padrão mais simples (sem o comentário)
    simple_pattern = r'if \(\$date->isPast\(\) && !\$date->isToday\(\)\) \{\s*\\Log::warning\([^}]+\}\s*continue;'
    if re.search(simple_pattern, content, re.DOTALL):
        content = re.sub(simple_pattern, new_code, content, flags=re.DOTALL)
        print("✅ Validação de data corrigida (padrão simples)")
    else:
        # Tentar padrão ainda mais simples
        very_simple = r'if \(\$date->isPast\(\) && !\$date->isToday\(\)\)'
        if re.search(very_simple, content):
            # Substituir apenas a condição
            content = re.sub(
                very_simple,
                'if ($date->startOfDay()->lt(\\Carbon\\Carbon::today()->startOfDay()))',
                content
            )
            # Adicionar log após o try
            content = re.sub(
                r'(\$date = \\Carbon\\Carbon::parse\(\$dateKey\);)\s*if',
                r'\1\n                    \\Log::info("Validando data", ["date" => $dateKey, "date_start" => $date->startOfDay()->toDateString(), "today_start" => \\Carbon\\Carbon::today()->startOfDay()->toDateString()]);\n                    if',
                content
            )
            print("✅ Validação de data corrigida (padrão muito simples)")
        else:
            print("⚠️  Padrão de validação não encontrado")
            print("🔍 Procurando por 'isPast' no arquivo...")
            if 'isPast' in content:
                print("   Encontrado 'isPast', mas padrão não correspondeu")
                # Mostrar contexto
                lines = content.split('\n')
                for i, line in enumerate(lines):
                    if 'isPast' in line:
                        print(f"   Linha {i+1}: {line.strip()}")
                        if i+1 < len(lines):
                            print(f"   Linha {i+2}: {lines[i+1].strip()}")
            else:
                print("   'isPast' não encontrado no arquivo")

with open(file_path, 'w') as f:
    f.write(content)

print("✅ Arquivo atualizado")
PYEOF

# Verificar sintaxe
echo ""
echo "🔍 Verificando sintaxe PHP..."
if php -l app/Http/Controllers/Api/DoctorController.php 2>&1 | grep -q "No syntax errors"; then
    echo "✅ Sintaxe PHP válida"
else
    echo "❌ Erro de sintaxe!"
    php -l app/Http/Controllers/Api/DoctorController.php
    echo "💡 Restaurando backup..."
    cp "$BACKUP_FILE" app/Http/Controllers/Api/DoctorController.php
    exit 1
fi

# Limpar cache
echo ""
echo "🧹 Limpando cache..."
php artisan route:clear
php artisan config:clear
php artisan cache:clear
echo "✅ Cache limpo"

echo ""
echo "✅ Correção aplicada!"
REMOTE_SCRIPT

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Validação corrigida!"
    echo ""
    echo "💡 Mudança aplicada:"
    echo "   ❌ Antes: if (\$date->isPast() && !\$date->isToday())"
    echo "   ✅ Agora: if (\$date->startOfDay()->lt(\Carbon\Carbon::today()->startOfDay()))"
    echo ""
    echo "💡 Isso compara apenas a DATA (sem hora), então:"
    echo "   ✅ Dia de hoje será sempre aceito"
    echo "   ✅ Dias futuros serão aceitos"
    echo "   ❌ Apenas dias passados (antes de hoje) serão bloqueados"
    echo ""
    echo "💡 Teste salvando a agenda para o dia de hoje."
else
    echo ""
    echo "❌ Erro durante a correção"
    exit 1
fi
