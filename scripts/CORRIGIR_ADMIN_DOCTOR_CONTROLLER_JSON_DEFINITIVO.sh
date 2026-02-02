#!/bin/bash

# Script para corrigir o problema de "use AppHttpControllers..." aparecendo antes do JSON
# no AdminDoctorController

set -e

SERVER="10.102.0.103"
USER="darley"
PASSWORD="yhvh77"
PORT="63022"
CONTROLLER_PATH="app/Http/Controllers/Api/AdminDoctorController.php"
BACKEND_DIR="/var/www/lacos-backend"

echo "🔧 Corrigindo AdminDoctorController para remover output antes do JSON..."
echo ""

# Ler o controller atual e adicionar ob_clean() em todos os métodos
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" << 'REMOTE_SCRIPT'
    export SUDO_PASS='yhvh77'
    cd /var/www/lacos-backend
    
    # Fazer backup
    if [ -f app/Http/Controllers/Api/AdminDoctorController.php ]; then
        echo "$SUDO_PASS" | sudo -S cp app/Http/Controllers/Api/AdminDoctorController.php app/Http/Controllers/Api/AdminDoctorController.php.bak.$(date +%Y%m%d_%H%M%S)
    fi
    
    # Criar script Python para adicionar ob_clean() em todos os métodos
    python3 << 'PYTHON_SCRIPT'
import re

# Ler o arquivo
with open('app/Http/Controllers/Api/AdminDoctorController.php', 'r') as f:
    content = f.read()

# Adicionar ob_clean() no início de cada método público
# Padrão: public function nome() {
pattern = r'(public function\s+\w+\([^)]*\)\s*\{)'
replacement = r'\1\n        if (ob_get_level()) {\n            ob_clean();\n        }'

content = re.sub(pattern, replacement, content)

# Adicionar ob_clean() antes de cada return response()->json(
pattern2 = r'(\s+)(return\s+response\(\)->json\()'
replacement2 = r'\1if (ob_get_level()) {\n\1    ob_clean();\n\1}\n\1\2'

content = re.sub(pattern2, replacement2, content)

# Salvar
with open('/tmp/AdminDoctorController_CORRIGIDO.php', 'w') as f:
    f.write(content)

print("✅ Controller corrigido")
PYTHON_SCRIPT

    # Substituir o controller
    echo "$SUDO_PASS" | sudo -S mv /tmp/AdminDoctorController_CORRIGIDO.php app/Http/Controllers/Api/AdminDoctorController.php
    echo "$SUDO_PASS" | sudo -S chown www-data:www-data app/Http/Controllers/Api/AdminDoctorController.php
    echo "$SUDO_PASS" | sudo -S chmod 644 app/Http/Controllers/Api/AdminDoctorController.php
    
    # Limpar cache
    echo "$SUDO_PASS" | sudo -S -u www-data php artisan route:clear
    echo "$SUDO_PASS" | sudo -S -u www-data php artisan config:clear
    echo "$SUDO_PASS" | sudo -S -u www-data php artisan cache:clear
    echo "$SUDO_PASS" | sudo -S -u www-data php artisan optimize:clear
    
    echo "✅ Correção aplicada"
REMOTE_SCRIPT

echo ""
echo "✅ Correção aplicada com sucesso!"
echo ""
echo "📝 O AdminDoctorController foi corrigido para:"
echo "   - Limpar output buffer antes de retornar JSON"
echo "   - Garantir que não há texto antes do JSON"
echo ""













