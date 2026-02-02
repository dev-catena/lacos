#!/bin/bash

# Script para adicionar CPF no retorno do AdminDoctorController

set -e

SERVER="10.102.0.103"
USER="darley"
PASSWORD="yhvh77"
PORT="63022"
CONTROLLER_PATH="app/Http/Controllers/Api/AdminDoctorController.php"
BACKEND_DIR="/var/www/lacos-backend"

echo "🔧 Adicionando CPF no retorno do AdminDoctorController..."
echo ""

# Baixar o controller atual
echo "📥 Baixando controller atual..."
sshpass -p "$PASSWORD" scp -P "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER:$BACKEND_DIR/$CONTROLLER_PATH" /tmp/AdminDoctorController_ATUAL.php

# Processar o arquivo para adicionar CPF nos retornos
python3 << 'PYTHON_SCRIPT'
import re

# Ler o arquivo
with open('/tmp/AdminDoctorController_ATUAL.php', 'r') as f:
    content = f.read()

# Adicionar CPF no método getPending()
# Procurar pelo return array no método getPending
pattern1 = r"(return \[[\s\S]*?'email' => \$doctor->email,[\s\S]*?'crm' => \$doctor->crm \?\? null,[\s\S]*?'specialty' => \$specialty,[\s\S]*?'created_at' => \$doctor->created_at,[\s\S]*?\];[\s\S]*?return response\(\)->json\(\$doctors\);[\s\S]*?} catch \([\s\S]*?}[\s\S]*?}[\s\S]*?public function getPending\(\)[\s\S]*?return \[)"
# Vamos fazer uma substituição mais específica
# Primeiro, adicionar CPF no getPending
content = re.sub(
    r"('email' => \$doctor->email,\s*)('crm' => \$doctor->crm \?\? null,)",
    r"\1'cpf' => \$doctor->cpf \?\? null,\n                        \2",
    content
)

# Adicionar CPF no método index()
content = re.sub(
    r"('email' => \$doctor->email,\s*)('crm' => \$doctor->crm \?\? null,)(\s*'specialty' => \$specialty,)(\s*'is_blocked' =>)",
    r"\1'cpf' => \$doctor->cpf \?\? null,\n                        \2\3\4",
    content
)

# Salvar
with open('/tmp/AdminDoctorController_COM_CPF.php', 'w') as f:
    f.write(content)

print("✅ CPF adicionado ao controller")
PYTHON_SCRIPT

echo "📤 Enviando controller atualizado para o servidor..."
sshpass -p "$PASSWORD" scp -P "$PORT" -o StrictHostKeyChecking=no /tmp/AdminDoctorController_COM_CPF.php "$USER@$SERVER:/tmp/AdminDoctorController_COM_CPF.php"

echo ""
echo "🔧 Aplicando correção no servidor..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" << EOF
    export SUDO_PASS='$PASSWORD'
    cd $BACKEND_DIR
    
    # Fazer backup
    if [ -f $CONTROLLER_PATH ]; then
        echo "\$SUDO_PASS" | sudo -S cp $CONTROLLER_PATH ${CONTROLLER_PATH}.bak.cpf.\$(date +%Y%m%d_%H%M%S)
        echo "✅ Backup criado"
    fi
    
    # Substituir o controller
    echo "\$SUDO_PASS" | sudo -S mv /tmp/AdminDoctorController_COM_CPF.php $CONTROLLER_PATH
    echo "\$SUDO_PASS" | sudo -S chown www-data:www-data $CONTROLLER_PATH
    echo "\$SUDO_PASS" | sudo -S chmod 644 $CONTROLLER_PATH
    
    echo "✅ Controller atualizado"
    
    # Limpar cache
    echo "\$SUDO_PASS" | sudo -S -u www-data php artisan route:clear
    echo "\$SUDO_PASS" | sudo -S -u www-data php artisan config:clear
    echo "\$SUDO_PASS" | sudo -S -u www-data php artisan cache:clear
    echo "\$SUDO_PASS" | sudo -S -u www-data php artisan optimize:clear
    
    echo "✅ Cache limpo"
EOF

echo ""
echo "✅ CPF adicionado com sucesso!"
echo ""
echo "📝 O AdminDoctorController agora retorna o CPF nos métodos:"
echo "   - getPending() - Médicos pendentes"
echo "   - index() - Todos os médicos"
echo ""
echo "🔄 Teste acessando: http://admin.lacosapp.com/medicos"












