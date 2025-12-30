#!/bin/bash

# Script para corrigir o endpoint /user para usar makeVisible

SSH_USER="darley"
SSH_HOST="193.203.182.22"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "📦 Criando script Python para corrigir endpoint /user..."

# Criar o script Python que será executado no servidor
cat > /tmp/corrigir_endpoint_user.py << 'PYTHON_SCRIPT'
#!/usr/bin/env python3
import sys
import subprocess
import os
from datetime import datetime

BACKEND_PATH = "/var/www/lacos-backend"
file_path = os.path.join(BACKEND_PATH, "routes/api.php")

try:
    # Ler o arquivo com sudo
    result = subprocess.run(['sudo', 'cat', file_path], capture_output=True, text=True, check=True)
    content = result.stdout
    
    # Fazer backup
    backup = f"/tmp/api.php.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    with open(backup, 'w') as f:
        f.write(content)
    print(f"✅ Backup: {backup}")
    
    # Procurar pela linha: return response()->json($user);
    old_line = "        return response()->json(\$user);"
    new_line = """        return response()->json(\$user->makeVisible([
            'certificate_path',
            'certificate_apx_path',
            'certificate_username',
            'certificate_type',
            'has_certificate',
            'certificate_uploaded_at'
        ]));"""
    
    if old_line in content:
        new_content = content.replace(old_line, new_line)
        
        # Escrever em /tmp primeiro com nome único
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        tmp_file = f'/tmp/api.php.new.{timestamp}'
        with open(tmp_file, 'w') as f:
            f.write(new_content)
        
        # Mover para o destino com sudo
        subprocess.run(['sudo', 'cp', tmp_file, file_path], check=True)
        subprocess.run(['sudo', 'chown', 'www-data:www-data', file_path], check=True)
        subprocess.run(['sudo', 'chmod', '644', file_path], check=True)
        
        print('✅ Endpoint /user corrigido para usar makeVisible')
        
        # Limpar cache
        os.chdir(BACKEND_PATH)
        subprocess.run(['sudo', 'php', 'artisan', 'route:clear'], check=True, capture_output=True)
        subprocess.run(['sudo', 'php', 'artisan', 'config:clear'], check=True, capture_output=True)
        subprocess.run(['sudo', 'php', 'artisan', 'cache:clear'], check=True, capture_output=True)
        
        print('✅ Cache limpo')
    else:
        # Verificar se já está corrigido
        if 'makeVisible' in content and 'certificate_path' in content:
            print('✅ Endpoint /user já está corrigido')
        else:
            print(f'❌ Linha não encontrada: {old_line}')
            print('Procurando variações...')
            if 'response()->json($user)' in content:
                print('⚠️  Encontrado response()->json($user) mas formato diferente')
                # Tentar encontrar a linha exata
                lines = content.split('\n')
                for i, line in enumerate(lines):
                    if 'response()->json($user)' in line and 'makeVisible' not in line:
                        print(f'   Linha {i+1}: {line.strip()}')
            sys.exit(1)
        
except Exception as e:
    print(f'❌ Erro: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
PYTHON_SCRIPT

# Tornar o script executável
chmod +x /tmp/corrigir_endpoint_user.py

echo "📤 Enviando script para o servidor..."

# Enviar o script para /tmp no servidor
sshpass -p "$SSH_PASS" scp -P "$SSH_PORT" /tmp/corrigir_endpoint_user.py "$SSH_USER@$SSH_HOST:/tmp/corrigir_endpoint_user.py"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Script enviado para /tmp/corrigir_endpoint_user.py no servidor"
    echo ""
    echo "📋 Para executar no servidor:"
    echo "   ssh -p $SSH_PORT $SSH_USER@$SSH_HOST"
    echo "   sudo python3 /tmp/corrigir_endpoint_user.py"
else
    echo "❌ Erro ao enviar script"
    exit 1
fi





