#!/bin/bash

# Script para testar o endpoint de upload de certificado diretamente

SSH_USER="darley"
SSH_HOST="192.168.0.20"
SSH_PORT="63022"
BACKEND_PATH="/var/www/lacos-backend"

echo "🧪 Testando endpoint de certificado..."
echo ""
echo "📋 Este script verifica se o endpoint está acessível e funcionando"
echo ""

# Verificar se a rota está registrada e funcionando
echo "1. Verificando rotas..."
sshpass -p "yhvh77" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $BACKEND_PATH && php artisan route:list | grep certificate" 2>&1 | grep -v "PHP Warning" | grep -v "password"

echo ""
echo "2. Verificando se a classe pode ser instanciada..."
sshpass -p "yhvh77" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $BACKEND_PATH && php artisan tinker --execute=\"
try {
    \$controller = new App\\\\Http\\\\Controllers\\\\Api\\\\CertificateController();
    echo '✅ Classe instanciada com sucesso!' . PHP_EOL;
} catch (Exception \$e) {
    echo '❌ Erro: ' . \$e->getMessage() . PHP_EOL;
    echo 'Tipo: ' . get_class(\$e) . PHP_EOL;
}
\"" 2>&1 | grep -v "PHP Warning" | grep -v "password"

echo ""
echo "3. Verificando logs de tentativas de upload (últimas 24 horas)..."
sshpass -p "yhvh77" ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "grep -i 'certificate\|upload.*pfx\|POST.*certificate' $BACKEND_PATH/storage/logs/laravel.log | tail -20" 2>&1 | grep -v "password" || echo "Nenhum log de upload encontrado"

echo ""
echo "✅ Teste concluído!"














