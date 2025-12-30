#!/bin/bash

# Script para criar e enviar script Python para corrigir endpoint /user no servidor

SSH_USER="darley"
SSH_HOST="193.203.182.22"
SSH_PORT="63022"
SSH_PASS="yhvh77"

echo "📦 Criando script Python para executar no servidor..."

# Criar o script Python que será executado no servidor
cat > /tmp/corrigir_user_endpoint.py << 'PYTHON_SCRIPT'
#!/usr/bin/env python3
import sys
import subprocess
import os
from datetime import datetime

BACKEND_PATH = "/var/www/lacos-backend"
file_path = os.path.join(BACKEND_PATH, "routes/api.php")

try:
    # Ler o arquivo
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Fazer backup
    backup_path = f"{file_path}.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    with open(backup_path, 'w') as f:
        f.write(content)
    print(f"✅ Backup criado: {backup_path}")
    
    # Substituir a linha
    old_line = "return response()->json($user);"
    new_line = """return response()->json($user->makeVisible([
            'certificate_path',
            'certificate_apx_path',
            'certificate_username',
            'certificate_type',
            'has_certificate',
            'certificate_uploaded_at'
        ]));"""
    
    if old_line in content:
        new_content = content.replace(old_line, new_line)
        
        # Escrever o arquivo modificado
        with open(file_path, 'w') as f:
            f.write(new_content)
        
        # Ajustar permissões
        subprocess.run(['chown', 'www-data:www-data', file_path], check=True)
        subprocess.run(['chmod', '644', file_path], check=True)
        
        print("✅ Arquivo modificado")
        
        # Limpar cache
        os.chdir(BACKEND_PATH)
        subprocess.run(['php', 'artisan', 'route:clear'], check=True, capture_output=True)
        subprocess.run(['php', 'artisan', 'config:clear'], check=True, capture_output=True)
        subprocess.run(['php', 'artisan', 'cache:clear'], check=True, capture_output=True)
        
        print("✅ Cache limpo")
        print("")
        print("🎉 Correção aplicada com sucesso!")
    else:
        print(f"❌ Linha não encontrada: {old_line}")
        print("Procurando variações...")
        if "response()->json($user)" in content:
            print("⚠️  Encontrado 'response()->json($user)' mas sem 'return' no início")
        sys.exit(1)
        
except Exception as e:
    print(f"❌ Erro: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
PYTHON_SCRIPT

# Tornar o script executável
chmod +x /tmp/corrigir_user_endpoint.py

echo "📤 Enviando script para o servidor..."

# Verificar se sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    echo "⚠️  sshpass não encontrado. Use: sudo apt-get install sshpass"
    echo "   Ou copie manualmente: scp -P $SSH_PORT /tmp/corrigir_user_endpoint.py $SSH_USER@$SSH_HOST:/tmp/"
    exit 1
fi

# Enviar o script para /tmp no servidor
sshpass -p "$SSH_PASS" scp -P "$SSH_PORT" /tmp/corrigir_user_endpoint.py "$SSH_USER@$SSH_HOST:/tmp/corrigir_user_endpoint.py"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Script enviado para /tmp/corrigir_user_endpoint.py no servidor"
    echo ""
    echo "📋 Para executar no servidor:"
    echo "   1. Conecte-se: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST"
    echo "   2. Execute: sudo python3 /tmp/corrigir_user_endpoint.py"
    echo ""
    echo "   OU execute diretamente daqui:"
    echo "   sshpass -p '$SSH_PASS' ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'sudo python3 /tmp/corrigir_user_endpoint.py'"
else
    echo "❌ Erro ao enviar script"
    exit 1
fi





