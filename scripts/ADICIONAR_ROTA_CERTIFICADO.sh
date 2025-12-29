#!/bin/bash

# Script para adicionar a rota de upload de certificado

SSH_USER="darley"
SSH_HOST="193.203.182.22"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔧 Adicionando rota de upload de certificado..."

sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $BACKEND_PATH && python3 << 'PYTHON_SCRIPT'
import sys
import subprocess
import os
from datetime import datetime

file_path = 'routes/api.php'
full_path = os.path.join(os.getcwd(), file_path)

try:
    # Ler o arquivo
    try:
        with open(full_path, 'r') as f:
            content = f.read()
    except PermissionError:
        result = subprocess.run(['sudo', 'cat', full_path], capture_output=True, text=True, check=True)
        content = result.stdout
    
    # Verificar se a rota já existe
    if 'certificate/upload' in content or 'CertificateController' in content:
        print('✅ Rota de certificado já existe')
        sys.exit(0)
    
    # Fazer backup
    backup = f'/tmp/api.php.backup.{datetime.now().strftime(\"%Y%m%d_%H%M%S\")}'
    with open(backup, 'w') as f:
        f.write(content)
    print(f'✅ Backup: {backup}')
    
    # Encontrar onde adicionar a rota (dentro do grupo auth:sanctum, após as rotas de 2FA)
    # Procurar por: Route::post('/2fa/verify-code'
    pattern = \"Route::post('/2fa/verify-code'\"
    
    if pattern in content:
        # Adicionar após a linha de 2FA verify-code
        new_route = \"    Route::post('/2fa/verify-code', [AuthController::class, 'verify2FACode']);\\n    \\n    // Certificado Digital\\n    Route::post('/certificate/upload', [App\\\\Http\\\\Controllers\\\\Api\\\\CertificateController::class, 'upload']);\\n    Route::delete('/certificate/remove', [App\\\\Http\\\\Controllers\\\\Api\\\\CertificateController::class, 'remove']);\"
        content = content.replace(\"Route::post('/2fa/verify-code', [AuthController::class, 'verify2FACode']);\", new_route)
        
        # Escrever em /tmp primeiro
        tmp_file = '/tmp/api.php.new'
        with open(tmp_file, 'w') as f:
            f.write(content)
        
        # Mover para o destino
        try:
            subprocess.run(['cp', tmp_file, full_path], check=True)
            subprocess.run(['chown', 'www-data:www-data', full_path], check=True)
            subprocess.run(['chmod', '644', full_path], check=True)
        except:
            subprocess.run(['sudo', 'cp', tmp_file, full_path], check=True)
            subprocess.run(['sudo', 'chown', 'www-data:www-data', full_path], check=True)
            subprocess.run(['sudo', 'chmod', '644', full_path], check=True)
        
        print('✅ Rotas de certificado adicionadas')
        
        # Limpar cache
        try:
            subprocess.run(['php', 'artisan', 'route:clear'], check=True, capture_output=True)
            subprocess.run(['php', 'artisan', 'config:clear'], check=True, capture_output=True)
            subprocess.run(['php', 'artisan', 'cache:clear'], check=True, capture_output=True)
        except:
            subprocess.run(['sudo', 'php', 'artisan', 'route:clear'], check=True, capture_output=True)
            subprocess.run(['sudo', 'php', 'artisan', 'config:clear'], check=True, capture_output=True)
            subprocess.run(['sudo', 'php', 'artisan', 'cache:clear'], check=True, capture_output=True)
        
        print('✅ Cache limpo')
    else:
        print('❌ Padrão não encontrado para adicionar rota')
        sys.exit(1)
        
except Exception as e:
    print(f'❌ Erro: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
PYTHON_SCRIPT
"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Rota de certificado adicionada!"
else
    echo "❌ Erro ao adicionar rota"
    exit 1
fi



