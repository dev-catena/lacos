#!/bin/bash

SSH_USER="darley"
SSH_HOST="193.203.182.22"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔧 Corrigindo endpoint /user para retornar campos do certificado..."

sshpass -p "$SSH_PASS" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $BACKEND_PATH && sudo python3 << 'PYEOF'
import re
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
    print(f'✅ Backup criado: {backup}')
    
    # Padrão para encontrar a rota /user
    pattern = r\"Route::get\('/user',\s*function\s*\([^)]*\)\s*\{[^}]*return\s+response\(\)->json\(\$user\);\s*\}\);\"
    
    # Nova implementação que garante que os campos do certificado sejam visíveis
    replacement = '''Route::get('/user', function (Request \\$request) {
        \\$user = \\$request->user();
        
        // Verificar se o usuário está bloqueado
        if (\\$user && \\$user->is_blocked) {
            // Revogar todos os tokens do usuário bloqueado
            \\$user->tokens()->delete();
            
            return response()->json([
                'message' => 'Acesso negado. Sua conta foi bloqueada.',
                'error' => 'account_blocked'
            ], 403);
        }
        
        // Retornar usuário com todos os campos, incluindo certificado
        // makeVisible garante que campos ocultos sejam incluídos na resposta JSON
        return response()->json(\\$user->makeVisible([
            'certificate_path',
            'certificate_apx_path',
            'certificate_username',
            'certificate_type',
            'has_certificate',
            'certificate_uploaded_at'
        ]));
    });'''
    
    # Tentar substituir usando regex
    if re.search(pattern, content, re.DOTALL):
        new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
        with open(file_path, 'w') as f:
            f.write(new_content)
        import os
        os.chmod(file_path, 0o644)
        print('✅ Endpoint /user corrigido usando regex')
    else:
        # Tentar substituição mais simples
        old_line = 'return response()->json(\\$user);'
        new_lines = '''        return response()->json(\\$user->makeVisible([
            'certificate_path',
            'certificate_apx_path',
            'certificate_username',
            'certificate_type',
            'has_certificate',
            'certificate_uploaded_at'
        ]));'''
        
        if old_line in content:
            new_content = content.replace(old_line, new_lines)
            with open(file_path, 'w') as f:
                f.write(new_content)
            print('✅ Endpoint /user corrigido usando substituição simples')
        else:
            print('⚠️ Padrão não encontrado. Tentando busca mais ampla...')
            # Buscar por qualquer ocorrência de Route::get('/user'
            if \"Route::get('/user'\" in content:
                # Encontrar a linha e substituir manualmente
                lines = content.split('\\n')
                new_lines_list = []
                i = 0
                while i < len(lines):
                    if \"Route::get('/user'\" in lines[i]:
                        # Encontrar onde termina a função
                        new_lines_list.append(lines[i])
                        i += 1
                        # Copiar até encontrar return response()->json($user)
                        while i < len(lines):
                            if 'return response()->json($user);' in lines[i]:
                                new_lines_list.append(new_lines)
                                i += 1
                                break
                            else:
                                new_lines_list.append(lines[i])
                                i += 1
                    else:
                        new_lines_list.append(lines[i])
                        i += 1
                
                new_content = '\\n'.join(new_lines_list)
                with open(file_path, 'w') as f:
                    f.write(new_content)
                print('✅ Endpoint /user corrigido usando busca manual')
            else:
                print('❌ Rota /user não encontrada no arquivo!')
                sys.exit(1)
    
    # Limpar cache do Laravel
    import subprocess
    subprocess.run(['php', 'artisan', 'route:clear'], check=False)
    subprocess.run(['php', 'artisan', 'config:clear'], check=False)
    subprocess.run(['php', 'artisan', 'cache:clear'], check=False)
    print('✅ Cache do Laravel limpo')
    
    print('✅ Correção concluída!')
    
except Exception as e:
    print(f'❌ Erro: {e}')
    sys.exit(1)
PYEOF
"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Endpoint /user corrigido no servidor!"
    echo ""
    echo "📋 Agora teste no app:"
    echo "   1. Clique no botão '🔄 FORÇAR VERIFICAÇÃO NO SERVIDOR'"
    echo "   2. Os campos do certificado devem aparecer"
    echo "   3. O card verde deve aparecer se houver certificado instalado"
else
    echo "❌ Erro ao corrigir endpoint /user"
    exit 1
fi

