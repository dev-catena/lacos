#!/bin/bash

# Script para criar e enviar script Python para adicionar rota de certificado no servidor

SSH_USER="darley"
SSH_HOST="193.203.182.22"
SSH_PORT="63022"
SSH_PASS="yhvh77"

echo "📦 Criando script Python para adicionar rota de certificado no servidor..."

# Criar o script Python que será executado no servidor
cat > /tmp/adicionar_rota_certificado.py << 'PYTHON_SCRIPT'
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
    
    # Verificar se a rota já existe
    if 'certificate/upload' in content or 'CertificateController' in content:
        print('✅ Rota de certificado já existe')
        sys.exit(0)
    
    # Fazer backup
    backup = f"/tmp/api.php.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    with open(backup, 'w') as f:
        f.write(content)
    print(f"✅ Backup: {backup}")
    
    # Encontrar onde adicionar a rota (após as rotas de 2FA)
    # Procurar por: Route::post('/2fa/verify-code'
    old_line = "    Route::post('/2fa/verify-code', [AuthController::class, 'verify2FACode']);"
    new_lines = """    Route::post('/2fa/verify-code', [AuthController::class, 'verify2FACode']);
    
    // Certificado Digital
    Route::post('/certificate/upload', [App\\Http\\Controllers\\Api\\CertificateController::class, 'upload']);
    Route::delete('/certificate/remove', [App\\Http\\Controllers\\Api\\CertificateController::class, 'remove']);"""
    
    if old_line in content:
        new_content = content.replace(old_line, new_lines)
        
        # Escrever em /tmp primeiro com nome único
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        tmp_file = f'/tmp/api.php.new.{timestamp}'
        with open(tmp_file, 'w') as f:
            f.write(new_content)
        
        # Mover para o destino com sudo
        subprocess.run(['sudo', 'cp', tmp_file, file_path], check=True)
        subprocess.run(['sudo', 'chown', 'www-data:www-data', file_path], check=True)
        subprocess.run(['sudo', 'chmod', '644', file_path], check=True)
        
        print('✅ Rotas de certificado adicionadas')
        
        # Limpar cache
        os.chdir(BACKEND_PATH)
        subprocess.run(['sudo', 'php', 'artisan', 'route:clear'], check=True, capture_output=True)
        subprocess.run(['sudo', 'php', 'artisan', 'config:clear'], check=True, capture_output=True)
        subprocess.run(['sudo', 'php', 'artisan', 'cache:clear'], check=True, capture_output=True)
        
        print('✅ Cache limpo')
    else:
        print(f'❌ Linha não encontrada: {old_line}')
        print('Procurando variações...')
        if '2fa/verify-code' in content:
            print('⚠️  Encontrado 2fa/verify-code mas formato diferente')
        sys.exit(1)
        
except Exception as e:
    print(f'❌ Erro: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
PYTHON_SCRIPT

# Tornar o script executável
chmod +x /tmp/adicionar_rota_certificado.py

echo "📤 Enviando script para o servidor..."

# Verificar se sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    echo "⚠️  sshpass não encontrado. Use: sudo apt-get install sshpass"
    echo "   Ou copie manualmente: scp -P $SSH_PORT /tmp/adicionar_rota_certificado.py $SSH_USER@$SSH_HOST:/tmp/"
    exit 1
fi

# Enviar o script para /tmp no servidor
sshpass -p "$SSH_PASS" scp -P "$SSH_PORT" /tmp/adicionar_rota_certificado.py "$SSH_USER@$SSH_HOST:/tmp/adicionar_rota_certificado.py"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Script enviado para /tmp/adicionar_rota_certificado.py no servidor"
    echo ""
    echo "📋 Para executar no servidor:"
    echo "   1. Conecte-se: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST"
    echo "   2. Execute: sudo python3 /tmp/adicionar_rota_certificado.py"
    echo ""
    echo "   OU execute diretamente daqui:"
    echo "   sshpass -p '$SSH_PASS' ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'echo yhvh77 | sudo -S python3 /tmp/adicionar_rota_certificado.py'"
else
    echo "❌ Erro ao enviar script"
    exit 1
fi

