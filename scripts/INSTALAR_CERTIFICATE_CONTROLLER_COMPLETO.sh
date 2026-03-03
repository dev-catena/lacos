#!/bin/bash

# Script para copiar e instalar CertificateController no servidor

SSH_USER="darley"
SSH_HOST="192.168.0.20"
SSH_PORT="63022"
SSH_PASS="yhvh77"
BACKEND_PATH="/var/www/lacos-backend"

echo "📦 Copiando CertificateController para o servidor..."

# Verificar se o arquivo local existe
if [ ! -f "backend-laravel/CertificateController_APX.php" ]; then
    echo "❌ Arquivo backend-laravel/CertificateController_APX.php não encontrado!"
    exit 1
fi

# Copiar para /tmp no servidor
sshpass -p "$SSH_PASS" scp -P "$SSH_PORT" backend-laravel/CertificateController_APX.php "$SSH_USER@$SSH_HOST:/tmp/CertificateController.php"

if [ $? -ne 0 ]; then
    echo "❌ Erro ao copiar arquivo"
    exit 1
fi

echo "✅ Arquivo copiado para /tmp/CertificateController.php no servidor"
echo ""

# Criar script de instalação no servidor
cat > /tmp/instalar_certificate_controller.sh << 'INSTALL_SCRIPT'
#!/bin/bash

BACKEND_PATH="/var/www/lacos-backend"
CONTROLLER_PATH="$BACKEND_PATH/app/Http/Controllers/Api/CertificateController.php"

echo "🔧 Instalando CertificateController..."

# Verificar se o arquivo existe em /tmp
if [ ! -f "/tmp/CertificateController.php" ]; then
    echo "❌ Arquivo /tmp/CertificateController.php não encontrado!"
    exit 1
fi

# Fazer backup do arquivo existente (se houver)
if [ -f "$CONTROLLER_PATH" ]; then
    echo "📦 Fazendo backup do arquivo existente..."
    sudo cp "$CONTROLLER_PATH" "$CONTROLLER_PATH.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Copiar arquivo
echo "📝 Copiando CertificateController..."
echo "yhvh77" | sudo -S cp /tmp/CertificateController.php "$CONTROLLER_PATH"

# Ajustar permissões
echo "🔐 Ajustando permissões..."
echo "yhvh77" | sudo -S chown www-data:www-data "$CONTROLLER_PATH"
echo "yhvh77" | sudo -S chmod 644 "$CONTROLLER_PATH"

# Verificar se foi copiado corretamente
if [ -f "$CONTROLLER_PATH" ]; then
    echo "✅ CertificateController instalado com sucesso!"
    echo ""
    echo "📋 Verificando classe..."
    if grep -q "class CertificateController" "$CONTROLLER_PATH"; then
        echo "✅ Classe encontrada no arquivo"
    else
        echo "❌ Classe não encontrada no arquivo!"
        exit 1
    fi
else
    echo "❌ Erro: Arquivo não foi copiado!"
    exit 1
fi

# Limpar cache
echo ""
echo "🧹 Limpando cache do Laravel..."
cd "$BACKEND_PATH"
echo "yhvh77" | sudo -S php artisan route:clear
echo "yhvh77" | sudo -S php artisan config:clear
echo "yhvh77" | sudo -S php artisan cache:clear

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "📋 Verificando rota:"
php artisan route:list | grep certificate || echo "⚠️  Rota não encontrada (pode ser normal se houver erro de sintaxe)"
INSTALL_SCRIPT

# Tornar o script executável
chmod +x /tmp/instalar_certificate_controller.sh

# Copiar script para o servidor
sshpass -p "$SSH_PASS" scp -P "$SSH_PORT" /tmp/instalar_certificate_controller.sh "$SSH_USER@$SSH_HOST:/tmp/instalar_certificate_controller.sh"

if [ $? -eq 0 ]; then
    echo "✅ Script de instalação enviado para /tmp/instalar_certificate_controller.sh no servidor"
    echo ""
    echo "📋 Para instalar no servidor, execute:"
    echo "   ssh -p $SSH_PORT $SSH_USER@$SSH_HOST"
    echo "   bash /tmp/instalar_certificate_controller.sh"
    echo ""
    echo "   OU execute diretamente:"
    echo "   sshpass -p '$SSH_PASS' ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'bash /tmp/instalar_certificate_controller.sh'"
else
    echo "❌ Erro ao enviar script de instalação"
    exit 1
fi














