#!/bin/bash

# Script para corrigir autoload do CertificateController

SSH_USER="darley"
SSH_HOST="192.168.0.20"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔧 Corrigindo autoload do CertificateController..."
echo ""

# Criar script para executar no servidor
cat > /tmp/corrigir_autoload.sh << 'CORRIGIR_SCRIPT'
#!/bin/bash

BACKEND_PATH="/var/www/lacos-backend"

echo "🧹 Limpando todos os caches..."

cd "$BACKEND_PATH"

# Limpar cache do Composer
echo "📦 Limpando cache do Composer..."
echo "yhvh77" | sudo -S composer dump-autoload

# Limpar todos os caches do Laravel
echo "🧹 Limpando cache do Laravel..."
echo "yhvh77" | sudo -S php artisan clear-compiled
echo "yhvh77" | sudo -S php artisan config:clear
echo "yhvh77" | sudo -S php artisan route:clear
echo "yhvh77" | sudo -S php artisan cache:clear
echo "yhvh77" | sudo -S php artisan view:clear

# Limpar cache do OPcache (se estiver ativo)
echo "🔄 Limpando OPcache..."
echo "yhvh77" | sudo -S php -r "if (function_exists('opcache_reset')) { opcache_reset(); echo 'OPcache resetado'; } else { echo 'OPcache não está ativo'; }"

echo ""
echo "✅ Caches limpos!"
echo ""

# Verificar se a classe pode ser encontrada
echo "🔍 Verificando se a classe pode ser encontrada..."
echo "yhvh77" | sudo -S php artisan tinker --execute="
try {
    \$controller = new App\\Http\\Controllers\\Api\\CertificateController();
    echo '✅ Classe encontrada e instanciada com sucesso!' . PHP_EOL;
} catch (Exception \$e) {
    echo '❌ Erro: ' . \$e->getMessage() . PHP_EOL;
}
"

echo ""
echo "📋 Verificando rotas..."
echo "yhvh77" | sudo -S php artisan route:list | grep certificate || echo "⚠️  Rotas não encontradas"
CORRIGIR_SCRIPT

# Tornar executável
chmod +x /tmp/corrigir_autoload.sh

# Copiar para o servidor
sshpass -p "$SSH_PASS" scp -P "$SSH_PORT" /tmp/corrigir_autoload.sh "$SSH_USER@$SSH_HOST:/tmp/corrigir_autoload.sh"

if [ $? -eq 0 ]; then
    echo "✅ Script enviado para /tmp/corrigir_autoload.sh no servidor"
    echo ""
    echo "📋 Para executar no servidor:"
    echo "   ssh -p $SSH_PORT $SSH_USER@$SSH_HOST"
    echo "   bash /tmp/corrigir_autoload.sh"
    echo ""
    echo "   OU execute diretamente:"
    echo "   sshpass -p '$SSH_PASS' ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'bash /tmp/corrigir_autoload.sh'"
else
    echo "❌ Erro ao enviar script"
    exit 1
fi














