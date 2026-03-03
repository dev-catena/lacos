#!/bin/bash

# Script único para instalar tudo relacionado ao certificado no servidor

SSH_USER="darley"
SSH_HOST="192.168.0.20"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "📦 Criando script completo para instalar certificado no servidor..."

# Criar o script bash que será executado no servidor
cat > /tmp/instalar_tudo_certificado.sh << 'BASH_SCRIPT'
#!/bin/bash

BACKEND_PATH="/var/www/lacos-backend"

echo "🚀 Instalando CertificateController e corrigindo endpoint /user..."
echo ""

# 1. Instalar CertificateController
echo "📝 1. Instalando CertificateController..."
if [ -f "/tmp/CertificateController.php" ]; then
    sudo cp /tmp/CertificateController.php "$BACKEND_PATH/app/Http/Controllers/Api/CertificateController.php"
    sudo chown www-data:www-data "$BACKEND_PATH/app/Http/Controllers/Api/CertificateController.php"
    sudo chmod 644 "$BACKEND_PATH/app/Http/Controllers/Api/CertificateController.php"
    echo "✅ CertificateController instalado"
else
    echo "❌ Arquivo /tmp/CertificateController.php não encontrado!"
    exit 1
fi

echo ""

# 2. Corrigir endpoint /user
echo "📝 2. Corrigindo endpoint /user para usar makeVisible..."
if [ -f "/tmp/corrigir_endpoint_user.py" ]; then
    echo "yhvh77" | sudo -S python3 /tmp/corrigir_endpoint_user.py
    if [ $? -eq 0 ]; then
        echo "✅ Endpoint /user corrigido"
    else
        echo "❌ Erro ao corrigir endpoint /user"
        exit 1
    fi
else
    echo "❌ Script /tmp/corrigir_endpoint_user.py não encontrado!"
    exit 1
fi

echo ""

# 3. Limpar cache
echo "📝 3. Limpando cache do Laravel..."
cd "$BACKEND_PATH"
sudo php artisan route:clear
sudo php artisan config:clear
sudo php artisan cache:clear
echo "✅ Cache limpo"

echo ""
echo "🎉 Instalação concluída!"
echo ""
echo "📋 Verificações:"
echo "   1. Verificar rota: php artisan route:list | grep certificate"
echo "   2. Verificar endpoint: grep -A 5 'Route::get'\\\('/user' routes/api.php | grep makeVisible"
BASH_SCRIPT

# Tornar o script executável
chmod +x /tmp/instalar_tudo_certificado.sh

echo "📤 Enviando script para o servidor..."

# Enviar o script para /tmp no servidor
sshpass -p "$SSH_PASS" scp -P "$SSH_PORT" /tmp/instalar_tudo_certificado.sh "$SSH_USER@$SSH_HOST:/tmp/instalar_tudo_certificado.sh"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Script enviado para /tmp/instalar_tudo_certificado.sh no servidor"
    echo ""
    echo "📋 Para executar no servidor:"
    echo "   ssh -p $SSH_PORT $SSH_USER@$SSH_HOST"
    echo "   bash /tmp/instalar_tudo_certificado.sh"
    echo ""
    echo "   OU execute diretamente:"
    echo "   sshpass -p '$SSH_PASS' ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'bash /tmp/instalar_tudo_certificado.sh'"
else
    echo "❌ Erro ao enviar script"
    exit 1
fi














