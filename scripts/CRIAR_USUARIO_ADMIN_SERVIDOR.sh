#!/bin/bash

# Script para criar usuário admin no servidor remoto
# Uso: ./CRIAR_USUARIO_ADMIN_SERVIDOR.sh

SERVER="10.102.0.103"
PORT="63022"
USER="darley"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔐 Criando usuário admin@lacos.com no servidor remoto..."

# Comando para criar o usuário via SSH
ssh -p $PORT $USER@$SERVER << 'ENDSSH'
cd /var/www/lacos-backend

# Criar usuário admin se não existir
php artisan tinker --execute="
\$user = App\Models\User::where('email', 'admin@lacos.com')->first();
if (!\$user) {
    \$user = new App\Models\User();
    \$user->name = 'Administrador';
    \$user->last_name = 'Sistema';
    \$user->email = 'admin@lacos.com';
    \$user->password = Hash::make('admin123');
    \$user->user_type = 'caregiver';
    \$user->save();
    echo 'Usuario admin@lacos.com criado com sucesso!' . PHP_EOL;
} else {
    echo 'Usuario admin@lacos.com ja existe. Atualizando senha...' . PHP_EOL;
    \$user->password = Hash::make('admin123');
    \$user->save();
    echo 'Senha atualizada!' . PHP_EOL;
}
echo 'ID: ' . \$user->id . PHP_EOL;
echo 'Email: ' . \$user->email . PHP_EOL;
echo 'Nome: ' . \$user->name . PHP_EOL;
"

ENDSSH

if [ $? -eq 0 ]; then
    echo "✅ Usuário admin criado/atualizado no servidor remoto!"
    echo ""
    echo "📋 Credenciais:"
    echo "   Email: admin@lacos.com"
    echo "   Senha: admin123"
else
    echo "❌ Erro ao criar usuário no servidor remoto"
    echo ""
    echo "💡 Alternativa: Execute manualmente no servidor:"
    echo "   ssh -p $PORT $USER@$SERVER"
    echo "   cd $BACKEND_PATH"
    echo "   php artisan tinker"
    echo "   # Depois execute o código PHP acima"
fi





