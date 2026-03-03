#!/bin/bash

# Script simples para corrigir o endpoint /user

SSH_USER="darley"
SSH_HOST="192.168.0.20"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔧 Corrigindo endpoint /user (versão simples)..."

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
        # Se falhar, tentar com sudo
        result = subprocess.run(['sudo', 'cat', full_path], capture_output=True, text=True, check=True)
        content = result.stdout
    
    # Fazer backup
    backup_filename = f'api.php.backup.{datetime.now().strftime(\"%Y%m%d_%H%M%S\")}'
    tmp_backup = f'/tmp/{backup_filename}'
    with open(tmp_backup, 'w') as f:
        f.write(content)
    print(f'✅ Backup criado em: {tmp_backup}')
    
    # Substituir a linha específica: return response()->json($user);
    # Usar padrão mais flexível que aceita espaços e quebras de linha
    # Procurar por qualquer variação com espaços/tabs
    pattern = r'return\s+response\(\)->json\(\$user\);'
    new_line = '''return response()->json($user->makeVisible([
            'certificate_path',
            'certificate_apx_path',
            'certificate_username',
            'certificate_type',
            'has_certificate',
            'certificate_uploaded_at'
        ]));'''
    
    if re.search(pattern, content):
        new_content = re.sub(pattern, new_line, content)
        # new_content já foi criado acima com re.sub
        
        # Escrever em /tmp primeiro
        tmp_file = '/tmp/api.php.new'
        with open(tmp_file, 'w') as f:
            f.write(new_content)
        
        # Mover para o destino
        try:
            subprocess.run(['cp', tmp_file, full_path], check=True)
            subprocess.run(['chown', 'www-data:www-data', full_path], check=True)
            subprocess.run(['chmod', '644', full_path], check=True)
        except (PermissionError, subprocess.CalledProcessError):
            # Se falhar, tentar com sudo
            subprocess.run(['sudo', 'cp', tmp_file, full_path], check=True)
            subprocess.run(['sudo', 'chown', 'www-data:www-data', full_path], check=True)
            subprocess.run(['sudo', 'chmod', '644', full_path], check=True)
        
        print('✅ Rota /user modificada para retornar campos do certificado')
    else:
        print('❌ Linha \"return response()->json($user);\" não encontrada')
        print('   Conteúdo atual da rota:')
        # Mostrar as últimas linhas da rota
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if 'Route::get(\'/user\'' in line:
                for j in range(i, min(i+20, len(lines))):
                    print(f'   {lines[j]}')
                break
        sys.exit(1)
    
    # Limpar cache
    try:
        subprocess.run(['php', 'artisan', 'route:clear'], check=True, cwd=os.getcwd(), capture_output=True)
        subprocess.run(['php', 'artisan', 'config:clear'], check=True, cwd=os.getcwd(), capture_output=True)
        subprocess.run(['php', 'artisan', 'cache:clear'], check=True, cwd=os.getcwd(), capture_output=True)
        print('✅ Cache limpo')
    except subprocess.CalledProcessError:
        try:
            subprocess.run(['sudo', 'php', 'artisan', 'route:clear'], check=True, cwd=os.getcwd(), capture_output=True)
            subprocess.run(['sudo', 'php', 'artisan', 'config:clear'], check=True, cwd=os.getcwd(), capture_output=True)
            subprocess.run(['sudo', 'php', 'artisan', 'cache:clear'], check=True, cwd=os.getcwd(), capture_output=True)
            print('✅ Cache limpo (com sudo)')
        except:
            print('⚠️  Erro ao limpar cache (continuando mesmo assim...)')
    
except Exception as e:
    print(f'❌ Erro: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
PYTHON_SCRIPT
"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Endpoint /user corrigido com sucesso!"
    echo ""
    echo "📋 Agora teste no app:"
    echo "   1. Faça upload do certificado novamente"
    echo "   2. Saia e entre no app"
    echo "   3. Vá para: Perfil > Dados Profissionais"
    echo "   4. O card verde deve aparecer mostrando '✅ Certificado digital instalado'"
else
    echo "❌ Erro ao corrigir endpoint /user"
    exit 1
fi

