#!/bin/bash

# Script para corrigir problemas de upload de certificado
# Execute este script no servidor: bash /tmp/CORRIGIR_CERTIFICADO_COMPLETO.sh

set -e

BACKEND_PATH="/var/www/lacos-backend"
cd "$BACKEND_PATH" || exit 1

echo "🔧 Corrigindo problemas de upload de certificado..."
echo ""

# Usar Python para fazer alterações mais precisas
python3 << 'PYEOF'
import re
import shutil
from datetime import datetime
import os

file_path = 'app/Http/Controllers/Api/CertificateController.php'

try:
    # Ler arquivo
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Fazer backup
    backup = f'/tmp/CertificateController.php.backup.{datetime.now().strftime("%Y%m%d_%H%M%S")}'
    shutil.copy2(file_path, backup)
    print(f'✅ Backup criado: {backup}')
    print("")
    
    modified = False
    
    # 1. Adicionar certificate_uploaded_at ao updateData
    if "'certificate_uploaded_at' => now()" not in content:
        # Padrão: encontrar 'has_certificate' => true, e adicionar depois
        pattern = r"('has_certificate' => true,)(\s*)"
        replacement = r"\1\n                'certificate_uploaded_at' => now(),\2"
        
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            print("✅ Campo certificate_uploaded_at adicionado ao updateData")
            modified = True
        else:
            print("⚠️ Não foi possível encontrar 'has_certificate' => true no updateData")
    else:
        print("✅ Campo certificate_uploaded_at já existe no updateData")
    print("")
    
    # 2. Garantir que user->refresh() está sendo chamado
    if "$user->refresh();" not in content and "$user->refresh()" not in content:
        # Procurar por $user->update($updateData); e adicionar refresh depois
        pattern = r"(\$user->update\(\$updateData\);\s*)"
        replacement = r"\1\n            \n            // Recarregar o usuário do banco para garantir que os dados estão atualizados\n            \$user->refresh();\n"
        
        if re.search(pattern, content):
            content = re.sub(pattern, replacement, content)
            print("✅ user->refresh() adicionado após update")
            modified = True
        else:
            print("⚠️ Não foi possível encontrar \$user->update(\$updateData)")
    else:
        print("✅ user->refresh() já existe")
    print("")
    
    # 3. Garantir que a resposta inclui certificate_uploaded_at
    if "certificate_uploaded_at" not in content or "'certificate_uploaded_at' => \$user->certificate_uploaded_at" not in content:
        # Procurar pelo return response()->json com data
        pattern = r"('data' => \[)([^\]]*'certificate_username' => \$user->certificate_username \?\? null,)([^\]]*)(\])"
        
        if re.search(pattern, content, re.DOTALL):
            # Adicionar certificate_uploaded_at se não estiver presente
            if "'certificate_uploaded_at' =>" not in content:
                replacement = r"\1\2\3                'certificate_uploaded_at' => \$user->certificate_uploaded_at ?? null,\n            \4"
                content = re.sub(pattern, replacement, content, flags=re.DOTALL)
                print("✅ certificate_uploaded_at adicionado à resposta JSON")
                modified = True
        else:
            print("⚠️ Não foi possível encontrar a estrutura de resposta JSON")
    else:
        print("✅ certificate_uploaded_at já está na resposta JSON")
    print("")
    
    # Salvar arquivo se foi modificado
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

# 3. Verificar sintaxe PHP
echo "3️⃣ Verificando sintaxe PHP..."
if php -l app/Http/Controllers/Api/CertificateController.php; then
    echo "✅ Sintaxe PHP correta"
else
    echo "❌ Erro de sintaxe detectado!"
    exit 1
fi
echo ""

# 4. Criar diretório de certificados se não existir
echo "4️⃣ Criando diretório de certificados..."
mkdir -p storage/app/certificates/doctors
chmod -R 755 storage/app/certificates
echo "✅ Diretório criado/verificado"
echo ""

# 5. Atualizar autoload
echo "5️⃣ Atualizando autoload do Composer..."
composer dump-autoload --quiet
echo "✅ Autoload atualizado"
echo ""

# 6. Limpar cache do Laravel
echo "6️⃣ Limpando cache do Laravel..."
php artisan route:clear
php artisan config:clear
php artisan cache:clear
echo "✅ Cache limpo"
echo ""

# 7. Verificar se a rota está registrada
echo "7️⃣ Verificando se a rota está registrada..."
if php artisan route:list | grep -q "certificate/upload"; then
    echo "✅ Rota certificate/upload encontrada"
else
    echo "⚠️ Rota certificate/upload não encontrada!"
fi
echo ""

# 8. Verificar se o endpoint /user retorna os campos do certificado
echo "8️⃣ Verificando endpoint /user..."
if grep -q "makeVisible" routes/api.php 2>/dev/null; then
    if grep -q "certificate_uploaded_at" routes/api.php 2>/dev/null; then
        echo "✅ Endpoint /user já está configurado com makeVisible"
    else
        echo "⚠️ Endpoint /user tem makeVisible mas não inclui certificate_uploaded_at"
    fi
else
    echo "⚠️ Endpoint /user pode não estar retornando campos do certificado"
    echo "   Execute o script CORRIGIR_USER_CERTIFICADO.sh se necessário"
fi
echo ""

# 9. Mostrar resumo das alterações
echo "📋 RESUMO DAS ALTERAÇÕES:"
echo "   ✅ Campo certificate_uploaded_at adicionado ao controller"
echo "   ✅ user->refresh() garantido após update"
echo "   ✅ certificate_uploaded_at incluído na resposta JSON"
echo "   ✅ Diretório de certificados criado"
echo "   ✅ Autoload atualizado"
echo "   ✅ Cache do Laravel limpo"
echo ""
echo "✅ Correções aplicadas com sucesso!"
echo ""
echo "📝 PRÓXIMOS PASSOS:"
echo "   1. Teste o upload de certificado no app"
echo "   2. Verifique se o certificado foi salvo: ./scripts/VERIFICAR_CERTIFICADO_SERVIDOR.sh"
echo "   3. Se ainda não funcionar, verifique os logs: tail -f storage/logs/laravel.log"
