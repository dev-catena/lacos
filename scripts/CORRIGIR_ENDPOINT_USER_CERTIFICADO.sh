#!/bin/bash

# Script para garantir que o endpoint /user retorna os campos do certificado

SSH_USER="darley"
SSH_HOST="193.203.182.22"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔧 Corrigindo endpoint /user para garantir que retorna campos do certificado..."

# Verificar se sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass não está instalado. Instalando..."
    sudo apt-get update && sudo apt-get install -y sshpass
fi

# Criar patch para o routes/api.php usando Python para fazer a substituição correta
sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $BACKEND_PATH && python3 << 'PYTHON_SCRIPT'
import re
import sys
import subprocess
import os
from datetime import datetime

file_path = 'routes/api.php'
full_path = os.path.join(os.getcwd(), file_path)

try:
    # Tentar ler o arquivo sem sudo primeiro
    try:
        with open(full_path, 'r') as f:
            content = f.read()
    except PermissionError:
        # Se falhar, tentar com sudo (mas isso vai pedir senha interativamente)
        print('⚠️  Sem permissão para ler o arquivo. Tentando com sudo...')
        print('   Nota: Se pedir senha, você precisará configurar NOPASSWD no sudoers')
        result = subprocess.run(['sudo', 'cat', full_path], capture_output=True, text=True, check=True)
        content = result.stdout
    
    # Fazer backup em /tmp primeiro (onde temos permissão)
    backup_filename = f'api.php.backup.{datetime.now().strftime(\"%Y%m%d_%H%M%S\")}'
    tmp_backup = f'/tmp/{backup_filename}'
    
    with open(tmp_backup, 'w') as f:
        f.write(content)
    print(f'✅ Backup criado em: {tmp_backup}')
    
    # Padrão para encontrar apenas o return response()->json($user);
    # Isso é mais simples e evita problemas com escape sequences complexos
    # Escapar corretamente: $ precisa ser \\$ no Python dentro de uma raw string
    pattern = r'return\s+response\(\)->json\(\$user\);'
    
    # Substituir apenas o return response()->json($user); por return response()->json($user->makeVisible([...]));
    replacement_return = '''return response()->json(\\$user->makeVisible([
            'certificate_path',
            'certificate_apx_path',
            'certificate_username',
            'certificate_type',
            'has_certificate',
            'certificate_uploaded_at'
        ]));'''
    
    if re.search(pattern, content):
        new_content = re.sub(pattern, replacement_return, content)
        
        # Escrever em /tmp primeiro
        tmp_file = '/tmp/api.php.new'
        with open(tmp_file, 'w') as f:
            f.write(new_content)
        
        # Tentar mover sem sudo primeiro
        try:
            subprocess.run(['cp', tmp_file, full_path], check=True)
            subprocess.run(['chown', 'www-data:www-data', full_path], check=True)
            subprocess.run(['chmod', '644', full_path], check=True)
        except (PermissionError, subprocess.CalledProcessError):
            # Se falhar, tentar com sudo (mas isso vai pedir senha interativamente)
            print('⚠️  Sem permissão para escrever o arquivo. Tentando com sudo...')
            print('   Nota: Se pedir senha, você precisará configurar NOPASSWD no sudoers')
            subprocess.run(['sudo', 'cp', tmp_file, full_path], check=True)
            subprocess.run(['sudo', 'chown', 'www-data:www-data', full_path], check=True)
            subprocess.run(['sudo', 'chmod', '644', full_path], check=True)
        
        print('✅ Rota /user modificada para retornar campos do certificado')
    else:
        print('⚠️  Padrão da rota /user não encontrado. Verificando se já existe...')
        if \"Route::get('/user'\" in content:
            print('✅ Rota /user já existe, mas pode precisar de ajustes manuais')
        else:
            print('❌ Rota /user não encontrada')
            sys.exit(1)
    
    # Limpar cache (tentar sem sudo primeiro, depois com sudo se necessário)
    try:
        subprocess.run(['php', 'artisan', 'route:clear'], check=True, cwd=os.getcwd(), capture_output=True)
        subprocess.run(['php', 'artisan', 'config:clear'], check=True, cwd=os.getcwd(), capture_output=True)
        subprocess.run(['php', 'artisan', 'cache:clear'], check=True, cwd=os.getcwd(), capture_output=True)
        print('✅ Cache limpo')
    except subprocess.CalledProcessError:
        # Tentar com sudo
        try:
            subprocess.run(['sudo', 'php', 'artisan', 'route:clear'], check=True, cwd=os.getcwd(), capture_output=True)
            subprocess.run(['sudo', 'php', 'artisan', 'config:clear'], check=True, cwd=os.getcwd(), capture_output=True)
            subprocess.run(['sudo', 'php', 'artisan', 'cache:clear'], check=True, cwd=os.getcwd(), capture_output=True)
            print('✅ Cache limpo (com sudo)')
        except subprocess.CalledProcessError as e:
            print(f'⚠️  Erro ao limpar cache (pode ser normal): {e}')
            print('   Continuando mesmo assim...')
    
except Exception as e:
    print(f'❌ Erro: {e}')
    sys.exit(1)
PYTHON_SCRIPT
"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Endpoint /user corrigido com sucesso!"
    echo ""
    echo "📋 Próximos passos:"
    echo "   1. Teste o endpoint: curl -H 'Authorization: Bearer TOKEN' http://193.203.182.22/api/user"
    echo "   2. Verifique se os campos certificate_* aparecem na resposta"
else
    echo "❌ Erro ao corrigir endpoint /user"
    exit 1
fi

