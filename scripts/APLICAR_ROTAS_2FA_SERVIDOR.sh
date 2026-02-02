#!/bin/bash

# Script simples para adicionar rotas de 2FA no servidor
# Servidor: 10.102.0.103 (porta 63022)

set -e

SERVER="10.102.0.103"
PORT="63022"
USER="darley"
PASSWORD="yhvh77"
REMOTE_PATH="/var/www/lacos-backend"
ROUTES_FILE="$REMOTE_PATH/routes/api.php"

echo "🔧 Adicionando rotas de 2FA no servidor..."
echo "   Servidor: $USER@$SERVER:$PORT"
echo ""

# Verificar se sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass não está instalado!"
    echo "   Instale com: sudo apt-get install sshpass"
    exit 1
fi

# Criar script para executar no servidor
cat > /tmp/add_2fa_routes.sh << 'SCRIPT'
#!/bin/bash
set -e

ROUTES_FILE="/var/www/lacos-backend/routes/api.php"
BACKUP_FILE="${ROUTES_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

echo "📋 Fazendo backup de routes/api.php..."
sudo cp "$ROUTES_FILE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"

echo ""
echo "🔍 Verificando se rotas já existem..."

if grep -q "/2fa/enable" "$ROUTES_FILE"; then
    echo "ℹ️  Rotas de 2FA já existem. Pulando..."
else
    echo "➕ Adicionando rotas de 2FA..."
    
    # Encontrar a linha com change-password e adicionar após ela
    if grep -q "change-password" "$ROUTES_FILE"; then
        # Usar sed para adicionar as rotas após change-password
        sudo sed -i '/Route::post.*change-password.*ChangePasswordController/a\
\
    // 2FA (WhatsApp-only)\
    Route::post('\''/2fa/enable'\'', [AuthController::class, '\''enable2FA'\'']);\
    Route::post('\''/2fa/disable'\'', [AuthController::class, '\''disable2FA'\'']);\
    Route::post('\''/2fa/send-code'\'', [AuthController::class, '\''send2FACode'\'']);\
    Route::post('\''/2fa/verify-code'\'', [AuthController::class, '\''verify2FACode'\'']);\
' "$ROUTES_FILE"
        
        echo "✅ Rotas adicionadas!"
    else
        echo "❌ Não foi possível encontrar a linha 'change-password' em routes/api.php"
        echo "   Adicione manualmente após a linha de change-password:"
        echo ""
        echo "   // 2FA (WhatsApp-only)"
        echo "   Route::post('/2fa/enable', [AuthController::class, 'enable2FA']);"
        echo "   Route::post('/2fa/disable', [AuthController::class, 'disable2FA']);"
        echo "   Route::post('/2fa/send-code', [AuthController::class, 'send2FACode']);"
        echo "   Route::post('/2fa/verify-code', [AuthController::class, 'verify2FACode']);"
        exit 1
    fi
fi

echo ""
echo "🔧 Limpando cache do Laravel..."
cd /var/www/lacos-backend
sudo -u www-data php artisan config:clear
sudo -u www-data php artisan route:clear
sudo -u www-data php artisan cache:clear

echo ""
echo "✅ Rotas de 2FA configuradas!"
SCRIPT

# Enviar script para o servidor
echo "📤 Enviando script para o servidor..."
sshpass -p "$PASSWORD" scp -P "$PORT" -o StrictHostKeyChecking=no \
    /tmp/add_2fa_routes.sh \
    "$USER@$SERVER:/tmp/add_2fa_routes.sh"

# Executar no servidor
echo ""
echo "🔧 Executando script no servidor..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no \
    "$USER@$SERVER" "chmod +x /tmp/add_2fa_routes.sh && echo '$PASSWORD' | sudo -S bash /tmp/add_2fa_routes.sh"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Rotas de 2FA aplicadas com sucesso!"
    echo ""
    echo "💡 Agora você pode testar ativar o 2FA no app."
else
    echo ""
    echo "❌ Erro ao aplicar rotas. Verifique os logs acima."
    exit 1
fi

