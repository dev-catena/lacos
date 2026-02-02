#!/bin/bash

SSH_USER="darley"
SSH_HOST="10.102.0.103"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔧 Corrigindo endpoint /user (versão final)..."

sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $BACKEND_PATH && python3 << 'PYEOF'
import sys

file_path = 'routes/api.php'

try:
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Fazer backup
    import shutil
    from datetime import datetime
    backup = f'/tmp/api.php.backup.{datetime.now().strftime(\"%Y%m%d_%H%M%S\")}'
    shutil.copy2(file_path, backup)
    print(f'✅ Backup: {backup}')
    
    # Substituição simples de string
    # O $ precisa ser escapado ou usar raw string
    old = 'return response()->json(\$user);'
    new = '''return response()->json(\$user->makeVisible([
            'certificate_path',
            'certificate_apx_path',
            'certificate_username',
            'certificate_type',
            'has_certificate',
            'certificate_uploaded_at'
        ]));'''
    
    if old in content:
        new_content = content.replace(old, new)
        with open('/tmp/api.php.new', 'w') as f:
            f.write(new_content)
        
        import subprocess
        import os
        # Sempre usar sudo com senha via echo
        sudo_pass = 'yhvh77'
        try:
            # Tentar sem sudo primeiro
            subprocess.run(['cp', '/tmp/api.php.new', file_path], check=True)
            subprocess.run(['chown', 'www-data:www-data', file_path], check=True)
            subprocess.run(['chmod', '644', file_path], check=True)
        except:
            # Usar sudo com senha
            subprocess.run(['echo', sudo_pass, '|', 'sudo', '-S', 'cp', '/tmp/api.php.new', file_path], shell=True, check=True)
            subprocess.run(['echo', sudo_pass, '|', 'sudo', '-S', 'chown', 'www-data:www-data', file_path], shell=True, check=True)
            subprocess.run(['echo', sudo_pass, '|', 'sudo', '-S', 'chmod', '644', file_path], shell=True, check=True)
        
        print('✅ Arquivo modificado')
        
        # Limpar cache
        sudo_pass = 'yhvh77'
        try:
            subprocess.run(['php', 'artisan', 'route:clear'], check=True, capture_output=True)
            subprocess.run(['php', 'artisan', 'config:clear'], check=True, capture_output=True)
            subprocess.run(['php', 'artisan', 'cache:clear'], check=True, capture_output=True)
        except:
            subprocess.run([f'echo {sudo_pass} | sudo -S php artisan route:clear'], shell=True, check=True, capture_output=True)
            subprocess.run([f'echo {sudo_pass} | sudo -S php artisan config:clear'], shell=True, check=True, capture_output=True)
            subprocess.run([f'echo {sudo_pass} | sudo -S php artisan cache:clear'], shell=True, check=True, capture_output=True)
        
        print('✅ Cache limpo')
    else:
        print(f'❌ String não encontrada: {old}')
        print('Procurando variações...')
        if 'response()->json($user)' in content:
            print('⚠️  Encontrado sem "return" - pode precisar ajuste manual')
        sys.exit(1)
        
except Exception as e:
    print(f'❌ Erro: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
PYEOF
"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Correção aplicada!"
    echo ""
    echo "📋 Teste no app agora:"
    echo "   1. Faça upload do certificado"
    echo "   2. Saia e entre no app"
    echo "   3. Vá para: Perfil > Dados Profissionais"
    echo "   4. O card verde deve aparecer!"
else
    echo "❌ Erro"
    exit 1
fi

