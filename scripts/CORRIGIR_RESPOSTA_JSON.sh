#!/bin/bash

# Script para corrigir a resposta JSON do CertificateController
# Execute este script no servidor: bash /tmp/CORRIGIR_RESPOSTA_JSON.sh

set -e

BACKEND_PATH="/var/www/lacos-backend"
cd "$BACKEND_PATH" || exit 1

echo "🔧 Corrigindo resposta JSON do CertificateController..."
echo ""

python3 << 'PYEOF'
import re
import shutil
from datetime import datetime

file_path = 'app/Http/Controllers/Api/CertificateController.php'

try:
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Fazer backup
    backup = f'/tmp/CertificateController.php.backup.json.{datetime.now().strftime("%Y%m%d_%H%M%S")}'
    shutil.copy2(file_path, backup)
    print(f'✅ Backup criado: {backup}')
    print("")
    
    modified = False
    
    # Procurar pela resposta JSON e adicionar certificate_path e certificate_uploaded_at
    # Padrão: encontrar 'data' => [ ... ] dentro do return response()->json
    pattern = r"('data' => \[)([^\]]*'certificate_username' => \$user->certificate_username \?\? null,)([^\]]*)(\])"
    
    if re.search(pattern, content, re.DOTALL):
        # Verificar se certificate_path e certificate_uploaded_at já estão presentes
        if "'certificate_path' =>" not in content or "'certificate_uploaded_at' =>" not in content:
            # Adicionar os campos faltantes
            replacement = r"\1\2\3                'certificate_path' => \$user->certificate_path ?? null,\n                'certificate_uploaded_at' => \$user->certificate_uploaded_at ?? null,\n            \4"
            content = re.sub(pattern, replacement, content, flags=re.DOTALL)
            print("✅ certificate_path e certificate_uploaded_at adicionados à resposta JSON")
            modified = True
        else:
            print("✅ certificate_path e certificate_uploaded_at já estão na resposta JSON")
    else:
        # Tentar padrão alternativo sem certificate_username
        pattern2 = r"('data' => \[)([^\]]*'certificate_type' => \$certificateType,)([^\]]*)(\])"
        if re.search(pattern2, content, re.DOTALL):
            replacement2 = r"\1\2\3                'certificate_username' => \$user->certificate_username ?? null,\n                'certificate_path' => \$user->certificate_path ?? null,\n                'certificate_uploaded_at' => \$user->certificate_uploaded_at ?? null,\n            \4"
            content = re.sub(pattern2, replacement2, content, flags=re.DOTALL)
            print("✅ Campos adicionados à resposta JSON (padrão alternativo)")
            modified = True
        else:
            print("⚠️ Não foi possível encontrar a estrutura de resposta JSON")
            print("   Verificando manualmente...")
            # Procurar por return response()->json com 'data'
            if "'data' =>" in content:
                print("   ✅ Estrutura 'data' encontrada, mas padrão não correspondeu")
                print("   Verifique manualmente o arquivo")
    
    if modified:
        with open(file_path, 'w') as f:
            f.write(content)
        print("✅ Arquivo CertificateController.php atualizado")
    else:
        print("ℹ️ Nenhuma alteração necessária")
    
except Exception as e:
    print(f"❌ Erro: {e}")
    import traceback
    traceback.print_exc()
    exit(1)
PYEOF

if [ $? -ne 0 ]; then
    echo "❌ Erro ao modificar CertificateController"
    exit 1
fi

echo ""

# Verificar sintaxe PHP
echo "🔍 Verificando sintaxe PHP..."
if php -l app/Http/Controllers/Api/CertificateController.php; then
    echo "✅ Sintaxe PHP correta"
else
    echo "❌ Erro de sintaxe detectado!"
    exit 1
fi
echo ""

# Limpar cache
echo "🔄 Limpando cache..."
php artisan route:clear > /dev/null 2>&1
php artisan config:clear > /dev/null 2>&1
php artisan cache:clear > /dev/null 2>&1
echo "✅ Cache limpo"
echo ""

echo "✅ Correção da resposta JSON concluída!"
echo ""
echo "📝 A resposta JSON agora deve incluir:"
echo "   - certificate_path"
echo "   - certificate_uploaded_at"
echo "   - certificate_username"
echo "   - certificate_type"
echo "   - has_certificate"




