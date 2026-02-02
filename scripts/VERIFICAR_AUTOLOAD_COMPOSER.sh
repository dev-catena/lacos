#!/bin/bash

# Script para verificar e corrigir autoload do Composer

SSH_USER="darley"
SSH_HOST="10.102.0.103"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "🔧 Verificando e corrigindo autoload do Composer..."
echo ""

# Criar script para executar no servidor
cat > /tmp/verificar_autoload.sh << 'AUTOLOAD_SCRIPT'
#!/bin/bash

BACKEND_PATH="/var/www/lacos-backend"

cd "$BACKEND_PATH"

echo "1. Verificando se composer.json tem o autoload correto..."
if grep -q "App\\\\Http\\\\Controllers\\\\Api\\\\CertificateController" composer.json 2>/dev/null; then
    echo "   ⚠️  CertificateController está em composer.json (não deveria estar)"
else
    echo "   ✅ composer.json não tem referência direta (correto)"
fi

echo ""
echo "2. Regenerando autoload do Composer..."
echo "yhvh77" | sudo -S composer dump-autoload --optimize 2>&1 | grep -v "PHP Warning" | grep -v "password" | tail -10

echo ""
echo "3. Verificando se o arquivo está no autoload..."
if [ -f "vendor/composer/autoload_classmap.php" ]; then
    if grep -q "CertificateController" vendor/composer/autoload_classmap.php; then
        echo "   ✅ CertificateController encontrado no autoload_classmap.php"
        grep "CertificateController" vendor/composer/autoload_classmap.php | head -1
    else
        echo "   ❌ CertificateController NÃO encontrado no autoload_classmap.php"
    fi
else
    echo "   ⚠️  Arquivo autoload_classmap.php não encontrado"
fi

echo ""
echo "4. Verificando namespace do arquivo..."
if [ -f "app/Http/Controllers/Api/CertificateController.php" ]; then
    NAMESPACE=$(grep "^namespace" app/Http/Controllers/Api/CertificateController.php | head -1)
    CLASS=$(grep "^class CertificateController" app/Http/Controllers/Api/CertificateController.php | head -1)
    echo "   Namespace: $NAMESPACE"
    echo "   Classe: $CLASS"
else
    echo "   ❌ Arquivo não encontrado!"
fi

echo ""
echo "5. Testando se o Laravel consegue encontrar a classe..."
echo "yhvh77" | sudo -S php -r "
require 'vendor/autoload.php';
\$app = require_once 'bootstrap/app.php';
\$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
try {
    \$reflection = new ReflectionClass('App\\Http\\Controllers\\Api\\CertificateController');
    echo '   ✅ Classe encontrada via ReflectionClass!' . PHP_EOL;
    echo '   Arquivo: ' . \$reflection->getFileName() . PHP_EOL;
} catch (ReflectionException \$e) {
    echo '   ❌ Erro: ' . \$e->getMessage() . PHP_EOL;
}
" 2>&1 | grep -v "PHP Warning" | grep -v "password"
AUTOLOAD_SCRIPT

# Tornar executável
chmod +x /tmp/verificar_autoload.sh

# Copiar para o servidor
sshpass -p "$SSH_PASS" scp -P "$SSH_PORT" /tmp/verificar_autoload.sh "$SSH_USER@$SSH_HOST:/tmp/verificar_autoload.sh"

if [ $? -eq 0 ]; then
    echo "✅ Script enviado para /tmp/verificar_autoload.sh no servidor"
    echo ""
    echo "📋 Para executar no servidor:"
    echo "   bash /tmp/verificar_autoload.sh"
else
    echo "❌ Erro ao enviar script"
    exit 1
fi














