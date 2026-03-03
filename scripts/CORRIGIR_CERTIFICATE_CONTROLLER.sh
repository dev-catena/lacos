#!/bin/bash

SSH_USER="darley"
SSH_HOST="192.168.0.20"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔧 Corrigindo CertificateController para adicionar certificate_uploaded_at..."

sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $BACKEND_PATH && python3 << 'PYEOF'
import re

file_path = 'app/Http/Controllers/Api/CertificateController.php'

try:
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Fazer backup
    import shutil
    from datetime import datetime
    backup = f'/tmp/CertificateController.php.backup.{datetime.now().strftime(\"%Y%m%d_%H%M%S\")}'
    shutil.copy2(file_path, backup)
    print(f'✅ Backup criado: {backup}')
    
    # Procurar onde está o updateData e adicionar certificate_uploaded_at
    # Padrão: $updateData = [ ... ]
    pattern = r\"(\\\$updateData = \\{[^}]*'has_certificate' => true,\\s*)(\\});\"
    
    replacement = r\"\1'certificate_uploaded_at' => now(),\n            \2\"
    
    if re.search(pattern, content, re.MULTILINE):
        new_content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
        with open(file_path, 'w') as f:
            f.write(new_content)
        print('✅ Campo certificate_uploaded_at adicionado ao updateData')
    else:
        # Tentar substituição mais simples
        old = \"'has_certificate' => true,\"
        new = \"'has_certificate' => true,\n                'certificate_uploaded_at' => now(),\"
        
        if old in content:
            new_content = content.replace(old, new)
            with open(file_path, 'w') as f:
                f.write(new_content)
            print('✅ Campo certificate_uploaded_at adicionado (método simples)')
        else:
            print('⚠️ Padrão não encontrado. Verificando estrutura do arquivo...')
            # Adicionar manualmente após has_certificate
            lines = content.split('\\n')
            new_lines = []
            for i, line in enumerate(lines):
                new_lines.append(line)
                if \"'has_certificate' => true,\" in line and i+1 < len(lines) and \"'certificate_uploaded_at'\" not in lines[i+1]:
                    new_lines.append(\"                'certificate_uploaded_at' => now(),\")
            
            new_content = '\\n'.join(new_lines)
            with open(file_path, 'w') as f:
                f.write(new_content)
            print('✅ Campo certificate_uploaded_at adicionado (método manual)')
    
    # Verificar sintaxe
    import subprocess
    result = subprocess.run(['php', '-l', file_path], capture_output=True, text=True)
    if 'No syntax errors' in result.stdout:
        print('✅ Sintaxe PHP verificada - sem erros')
    else:
        print(f'⚠️ Aviso de sintaxe: {result.stdout}')
    
    print('✅ Correção concluída!')
    
except Exception as e:
    print(f'❌ Erro: {e}')
    import traceback
    traceback.print_exc()
PYEOF
"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ CertificateController corrigido!"
    echo ""
    echo "📋 Agora teste o upload novamente no app"
else
    echo "❌ Erro ao corrigir CertificateController"
    exit 1
fi














