#!/bin/bash

# Script para adicionar rota de upload de certificado .pfx

SSH_USER="darley"
SSH_HOST="192.168.0.20"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔧 Adicionando rota de upload de certificado .pfx..."

sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $BACKEND_PATH && python3 << 'PYEOF'
import re
import shutil
from datetime import datetime

file_path = 'routes/api.php'

try:
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Fazer backup
    backup = f'/tmp/api.php.backup.{datetime.now().strftime(\"%Y%m%d_%H%M%S\")}'
    shutil.copy2(file_path, backup)
    print(f'✅ Backup criado: {backup}')
    
    # Verificar se a rota já existe
    if \"Route::post('/users/{id}/certificate'\" in content:
        print('✅ Rota já existe no arquivo')
    else:
        # Procurar pela linha Route::put('/users/{id}'
        pattern = r\"(Route::put\('/users/\{id\}', \[App\\\\Http\\\\Controllers\\\\Api\\\\UserController::class, 'update'\]\);)\"
        
        replacement = r\"\1\n    Route::post('/users/{id}/certificate', [App\\\\Http\\\\Controllers\\\\Api\\\\UserController::class, 'uploadCertificate']);\"
        
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            with open(file_path, 'w') as f:
                f.write(content)
            print('✅ Rota adicionada com sucesso')
        else:
            print('⚠️ Não foi possível encontrar a linha Route::put para adicionar a rota após ela')
            print('   Tentando adicionar manualmente...')
            # Tentar adicionar após qualquer rota de users
            pattern2 = r\"(Route::put\('/users/\{id\}',.*?\);)\"
            if re.search(pattern2, content):
                content = re.sub(pattern2, r\"\1\n    Route::post('/users/{id}/certificate', [App\\\\Http\\\\Controllers\\\\Api\\\\UserController::class, 'uploadCertificate']);\", content)
                with open(file_path, 'w') as f:
                    f.write(content)
                print('✅ Rota adicionada com sucesso (método alternativo)')
            else:
                print('❌ Não foi possível adicionar a rota automaticamente')
                import sys
                sys.exit(1)
    
    # Limpar cache
    import subprocess
    subprocess.run(['php', 'artisan', 'route:clear'], check=True)
    subprocess.run(['php', 'artisan', 'config:clear'], check=True)
    print('✅ Cache limpo')
    
except Exception as e:
    print(f'❌ Erro: {e}')
    import traceback
    import sys
    traceback.print_exc()
    sys.exit(1)
PYEOF"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Rota adicionada com sucesso!"
    echo ""
    echo "📋 Verificando se a rota foi registrada:"
    sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $BACKEND_PATH && php artisan route:list | grep -i 'users.*certificate\|certificate.*users'" 2>&1 | grep -v "PHP Warning"
else
    echo "❌ Erro ao adicionar rota"
    exit 1
fi

