#!/bin/bash

# Script para corrigir o problema de "use AppHttpControllers..." aparecendo antes do JSON
# no AdminDoctorController

set -e

SERVER="10.102.0.103"
USER="darley"
PASSWORD="yhvh77"
BACKEND_DIR="/var/www/lacos-backend"
CONTROLLER_PATH="app/Http/Controllers/Api/AdminDoctorController.php"

echo "🔧 Corrigindo AdminDoctorController para evitar texto antes do JSON..."
echo ""

# Ler o controller atual e adicionar limpeza de output buffer
sshpass -p "$PASSWORD" ssh -p 63022 -o StrictHostKeyChecking=no "$USER@$SERVER" "
    cd $BACKEND_DIR
    cat $CONTROLLER_PATH
" > /tmp/AdminDoctorController_ORIGINAL.php

# Criar versão corrigida adicionando ob_clean() em todos os métodos
python3 << 'PYTHON_SCRIPT'
import re

with open('/tmp/AdminDoctorController_ORIGINAL.php', 'r') as f:
    content = f.read()

# Adicionar ob_clean() no início de cada método público
# Padrão: public function nome() { -> public function nome() { if (ob_get_level()) { ob_clean(); }

def add_ob_clean_to_method(match):
    method_name = match.group(1)
    method_body_start = match.group(2)
    return f"    public function {method_name}()\n    {{\n        if (ob_get_level()) {{\n            ob_clean();\n        }}\n        {method_body_start}"

# Substituir métodos públicos
content = re.sub(
    r'    public function (\w+)\([^)]*\)\s*\{\s*\n(\s*)',
    lambda m: f"    public function {m.group(1)}()\n    {{\n        if (ob_get_level()) {{\n            ob_clean();\n        }}\n        ",
    content
)

# Adicionar ob_clean() antes de cada return response()->json()
content = re.sub(
    r'(\s+)return response\(\)->json\(',
    r'\1if (ob_get_level()) {\n\1    ob_clean();\n\1}\n\1return response()->json(',
    content
)

# Adicionar flags JSON nos response()->json()
content = re.sub(
    r'response\(\)->json\(([^,]+)\);',
    r'response()->json(\1, 200, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);',
    content
)

# Corrigir response()->json() com status code
content = re.sub(
    r'response\(\)->json\(([^,]+),\s*(\d+)\);',
    r'response()->json(\1, \2, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);',
    content
)

with open('/tmp/AdminDoctorController_CORRIGIDO.php', 'w') as f:
    f.write(content)

print("✅ Controller corrigido")
PYTHON_SCRIPT

# Se o Python não funcionar, usar sed para adicionar ob_clean() manualmente
if [ ! -f /tmp/AdminDoctorController_CORRIGIDO.php ]; then
    echo "⚠️  Python não disponível, usando método alternativo..."
    cp /tmp/AdminDoctorController_ORIGINAL.php /tmp/AdminDoctorController_CORRIGIDO.php
    
    # Adicionar ob_clean() no início de cada método usando sed
    sed -i 's/public function \([a-zA-Z]*\)() {/public function \1() {\n        if (ob_get_level()) {\n            ob_clean();\n        }/g' /tmp/AdminDoctorController_CORRIGIDO.php
    
    # Adicionar ob_clean() antes de return response()->json()
    sed -i 's/return response()->json(/if (ob_get_level()) {\n            ob_clean();\n        }\n        return response()->json(/g' /tmp/AdminDoctorController_CORRIGIDO.php
fi

echo "📤 Enviando controller corrigido para o servidor..."
sshpass -p "$PASSWORD" scp -P 63022 -o StrictHostKeyChecking=no /tmp/AdminDoctorController_CORRIGIDO.php "$USER@$SERVER:/tmp/AdminDoctorController_CORRIGIDO.php"

echo ""
echo "📝 Fazendo backup do controller atual..."
sshpass -p "$PASSWORD" ssh -p 63022 -o StrictHostKeyChecking=no "$USER@$SERVER" "
    export SUDO_PASS='$PASSWORD'
    cd $BACKEND_DIR
    if [ -f $CONTROLLER_PATH ]; then
        echo \"\$SUDO_PASS\" | sudo -S cp $CONTROLLER_PATH ${CONTROLLER_PATH}.backup.\$(date +%s)
        echo '✅ Backup criado'
    fi
"

echo ""
echo "🔄 Substituindo controller..."
sshpass -p "$PASSWORD" ssh -p 63022 -o StrictHostKeyChecking=no "$USER@$SERVER" "
    export SUDO_PASS='$PASSWORD'
    cd $BACKEND_DIR
    echo \"\$SUDO_PASS\" | sudo -S mv /tmp/AdminDoctorController_CORRIGIDO.php $CONTROLLER_PATH
    echo \"\$SUDO_PASS\" | sudo -S chown www-data:www-data $CONTROLLER_PATH
    echo \"\$SUDO_PASS\" | sudo -S chmod 644 $CONTROLLER_PATH
    echo '✅ Controller substituído'
"

echo ""
echo "🧹 Limpando cache do Laravel..."
sshpass -p "$PASSWORD" ssh -p 63022 -o StrictHostKeyChecking=no "$USER@$SERVER" "
    export SUDO_PASS='$PASSWORD'
    cd $BACKEND_DIR
    echo \"\$SUDO_PASS\" | sudo -S -u www-data php artisan route:clear
    echo \"\$SUDO_PASS\" | sudo -S -u www-data php artisan config:clear
    echo \"\$SUDO_PASS\" | sudo -S -u www-data php artisan cache:clear
    echo \"\$SUDO_PASS\" | sudo -S -u www-data php artisan optimize:clear
    echo '✅ Cache limpo'
"

echo ""
echo "✅ Correção aplicada com sucesso!"

