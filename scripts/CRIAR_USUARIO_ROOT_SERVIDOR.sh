#!/bin/bash

# Script para criar usuário root no servidor
# Uso: ./CRIAR_USUARIO_ROOT_SERVIDOR.sh

set -e

# Configurações do servidor
SERVER_HOST="193.203.182.22"
SERVER_PORT="63022"
SERVER_USER="darley"
SERVER_PASS="yhvh77"
SERVER_BACKEND="/var/www/lacos-backend"

echo "🔐 Criando usuário root no servidor..."
echo "   Servidor: $SERVER_USER@$SERVER_HOST:$SERVER_PORT"
echo ""

# Verificar se sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    echo "❌ Erro: sshpass não está instalado."
    echo "   Instale com: sudo apt-get install sshpass"
    exit 1
fi

# Executar comando no servidor para criar o usuário root
echo "📝 Criando usuário root@lacos.com..."
sshpass -p "$SERVER_PASS" ssh -p "$SERVER_PORT" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" << 'ENDSSH'
cd /var/www/lacos-backend

# Criar usuário root usando MySQL diretamente
mysql -u lacos -pLacos2025Secure lacos << 'SQL'
INSERT INTO users (name, email, password, profile, is_blocked, created_at, updated_at)
VALUES (
    'Root Admin',
    'root@lacos.com',
    '$2y$12$sa7QDAJm63o8Bu226AyaaOoFoLdtC6jm68uMLeLkMhZZ/l4ZgcB1S',
    'caregiver',
    0,
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    name = 'Root Admin',
    password = '$2y$12$sa7QDAJm63o8Bu226AyaaOoFoLdtC6jm68uMLeLkMhZZ/l4ZgcB1S',
    is_blocked = 0,
    updated_at = NOW();
SQL

# Verificar se o usuário foi criado
mysql -u lacos -pLacos2025Secure lacos << 'SQL'
SELECT id, name, email, profile, is_blocked, created_at 
FROM users 
WHERE email = 'root@lacos.com';
SQL

echo ""
echo "✅ Usuário root criado/atualizado com sucesso!"
echo ""
echo "📋 Credenciais:"
echo "   Email: root@lacos.com"
echo "   Senha: yhvh77"
echo ""
echo "⚠️  IMPORTANTE: Altere a senha após o primeiro login!"
ENDSSH

echo ""
echo "🎉 Processo concluído!"
echo ""
echo "📝 Agora você pode fazer login no admin web com:"
echo "   Email: root@lacos.com"
echo "   Senha: yhvh77"


