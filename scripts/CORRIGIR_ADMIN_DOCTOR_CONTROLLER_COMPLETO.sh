#!/bin/bash

# Script para corrigir o problema de "use AppHttpControllers..." aparecendo antes do JSON
# no AdminDoctorController - Versão completa

set -e

SERVER="193.203.182.22"
USER="darley"
PASSWORD="yhvh77"
PORT="63022"
CONTROLLER_PATH="app/Http/Controllers/Api/AdminDoctorController.php"
BACKEND_DIR="/var/www/lacos-backend"

echo "🔧 Corrigindo AdminDoctorController para remover output antes do JSON..."
echo ""

# Baixar o controller atual do servidor
echo "📥 Baixando controller atual do servidor..."
sshpass -p "$PASSWORD" scp -P "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER:$BACKEND_DIR/$CONTROLLER_PATH" /tmp/AdminDoctorController_ORIGINAL.php

# Processar o arquivo para adicionar ob_clean() em todos os métodos
python3 << 'PYTHON_SCRIPT'
import re

# Ler o arquivo original
with open('/tmp/AdminDoctorController_ORIGINAL.php', 'r') as f:
    content = f.read()

# Adicionar ob_clean() no início de cada método público
# Padrão: public function nome() {
pattern = r'(public function\s+\w+\([^)]*\)\s*\{)'
replacement = r'\1\n        if (ob_get_level()) {\n            ob_clean();\n        }'

content = re.sub(pattern, replacement, content)

# Adicionar ob_clean() antes de cada return response()->json(
# Mas não adicionar se já existe ob_clean() logo antes
pattern2 = r'(\s+)(return\s+response\(\)->json\()'
def replace_with_ob_clean(match):
    indent = match.group(1)
    # Verificar se já tem ob_clean() nas 3 linhas anteriores
    lines = content[:match.start()].split('\n')
    if len(lines) >= 3:
        last_3_lines = '\n'.join(lines[-3:])
        if 'ob_clean()' in last_3_lines:
            return match.group(0)
    
    return f'{indent}if (ob_get_level()) {{\n{indent}    ob_clean();\n{indent}}}\n{indent}{match.group(2)}'

content = re.sub(pattern2, replace_with_ob_clean, content)

# Adicionar flags JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES em todos os response()->json()
# Padrão: response()->json(...)
pattern3 = r'response\(\)->json\(([^,)]+)(?:,\s*(\d+))?(?:,\s*\[[^\]]*\])?\)'
def add_json_flags(match):
    params = match.group(1)
    status = match.group(2) if match.group(2) else '200'
    # Verificar se já tem as flags
    if 'JSON_UNESCAPED_UNICODE' in match.group(0):
        return match.group(0)
    
    return f'response()->json({params}, {status}, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)'

content = re.sub(pattern3, add_json_flags, content)

# Salvar
with open('/tmp/AdminDoctorController_CORRIGIDO.php', 'w') as f:
    f.write(content)

print("✅ Controller corrigido")
PYTHON_SCRIPT

echo "📤 Enviando controller corrigido para o servidor..."
sshpass -p "$PASSWORD" scp -P "$PORT" -o StrictHostKeyChecking=no /tmp/AdminDoctorController_CORRIGIDO.php "$USER@$SERVER:/tmp/AdminDoctorController_CORRIGIDO.php"

echo ""
echo "🔧 Aplicando correção no servidor..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" << EOF
    export SUDO_PASS='$PASSWORD'
    cd $BACKEND_DIR
    
    # Fazer backup do controller original
    if [ -f $CONTROLLER_PATH ]; then
        echo "\$SUDO_PASS" | sudo -S cp $CONTROLLER_PATH ${CONTROLLER_PATH}.bak.\$(date +%Y%m%d_%H%M%S)
        echo "✅ Backup criado"
    fi
    
    # Substituir o controller
    echo "\$SUDO_PASS" | sudo -S mv /tmp/AdminDoctorController_CORRIGIDO.php $CONTROLLER_PATH
    echo "\$SUDO_PASS" | sudo -S chown www-data:www-data $CONTROLLER_PATH
    echo "\$SUDO_PASS" | sudo -S chmod 644 $CONTROLLER_PATH
    
    echo "✅ Controller substituído"
    
    # Limpar cache do Laravel
    echo "\$SUDO_PASS" | sudo -S -u www-data php artisan route:clear
    echo "\$SUDO_PASS" | sudo -S -u www-data php artisan config:clear
    echo "\$SUDO_PASS" | sudo -S -u www-data php artisan cache:clear
    echo "\$SUDO_PASS" | sudo -S -u www-data php artisan optimize:clear
    
    echo "✅ Cache limpo"
EOF

echo ""
echo "✅ Correção aplicada com sucesso!"
echo ""
echo "📝 O AdminDoctorController foi corrigido para:"
echo "   - Limpar output buffer antes de retornar JSON"
echo "   - Garantir que não há texto antes do JSON"
echo "   - Usar flags JSON_UNESCAPED_UNICODE e JSON_UNESCAPED_SLASHES"
echo ""
echo "🔄 Teste acessando: http://admin.lacosapp.com/medicos"












