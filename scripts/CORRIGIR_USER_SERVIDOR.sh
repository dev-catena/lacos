#!/bin/bash

# Script para corrigir o endpoint /user no servidor
# Este script será executado diretamente no servidor

SSH_USER="darley"
SSH_HOST="192.168.0.20"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "📦 Criando script para executar no servidor..."

# Criar o script que será executado no servidor
cat > /tmp/corrigir_user_endpoint.sh << 'SCRIPT_SERVIDOR'
#!/bin/bash

# Script para corrigir endpoint /user
# Executar com: sudo bash /tmp/corrigir_user_endpoint.sh

BACKEND_PATH="/var/www/lacos-backend"
cd "$BACKEND_PATH" || exit 1

echo "🔧 Corrigindo endpoint /user..."

# Fazer backup
cp routes/api.php routes/api.php.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup criado"

# Usar sed para substituir a linha
# Procurar por: return response()->json($user);
# Substituir por: return response()->json($user->makeVisible([...]));

sed -i "s|return response()->json(\$user);|return response()->json(\$user->makeVisible([\n            'certificate_path',\n            'certificate_apx_path',\n            'certificate_username',\n            'certificate_type',\n            'has_certificate',\n            'certificate_uploaded_at'\n        ]));|g" routes/api.php

if [ $? -eq 0 ]; then
    echo "✅ Arquivo modificado"
    
    # Ajustar permissões
    chown www-data:www-data routes/api.php
    chmod 644 routes/api.php
    
    # Limpar cache
    php artisan route:clear
    php artisan config:clear
    php artisan cache:clear
    
    echo "✅ Cache limpo"
    echo ""
    echo "🎉 Correção aplicada com sucesso!"
else
    echo "❌ Erro ao modificar arquivo"
    exit 1
fi
SCRIPT_SERVIDOR

# Tornar o script executável
chmod +x /tmp/corrigir_user_endpoint.sh

echo "📤 Enviando script para o servidor..."

# Enviar o script para /tmp no servidor
if command -v sshpass &> /dev/null; then
    sshpass -p "$SSH_PASS" scp -P "$SSH_PORT" /tmp/corrigir_user_endpoint.sh "$SSH_USER@$SSH_HOST:/tmp/corrigir_user_endpoint.sh"
else
    echo "⚠️  sshpass não encontrado. Enviando manualmente..."
    scp -P "$SSH_PORT" /tmp/corrigir_user_endpoint.sh "$SSH_USER@$SSH_HOST:/tmp/corrigir_user_endpoint.sh"
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Script enviado para /tmp/corrigir_user_endpoint.sh no servidor"
    echo ""
    echo "📋 Para executar no servidor:"
    echo "   1. Conecte-se: ssh -p 63022 darley@192.168.0.20"
    echo "   2. Execute: sudo bash /tmp/corrigir_user_endpoint.sh"
    echo ""
    echo "   OU execute diretamente:"
    echo "   sshpass -p '$SSH_PASS' ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'sudo bash /tmp/corrigir_user_endpoint.sh'"
else
    echo "❌ Erro ao enviar script"
    exit 1
fi














