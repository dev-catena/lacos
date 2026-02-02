#!/bin/bash

# Script para instalar o endpoint de trocar senha no servidor
# Execute no servidor: bash INSTALAR_ENDPOINT_TROCAR_SENHA.sh

set -e

BACKEND_DIR="/var/www/lacos-backend"
CONTROLLER_FILE="ChangePasswordController.php"
ROUTES_FILE="routes/api.php"

echo "🔐 Instalando endpoint de trocar senha..."

# Verificar se está no diretório correto
if [ ! -f "$CONTROLLER_FILE" ]; then
    echo "❌ Erro: Arquivo $CONTROLLER_FILE não encontrado"
    echo "   Execute este script no diretório backend-laravel/"
    exit 1
fi

# 1. Copiar controller
echo "📁 Copiando ChangePasswordController..."
sudo cp "$CONTROLLER_FILE" "$BACKEND_DIR/app/Http/Controllers/Api/"
sudo chown www-data:www-data "$BACKEND_DIR/app/Http/Controllers/Api/$CONTROLLER_FILE"
sudo chmod 644 "$BACKEND_DIR/app/Http/Controllers/Api/$CONTROLLER_FILE"

echo "✅ Controller copiado com sucesso!"

# 2. Verificar se a rota já existe
if grep -q "change-password" "$BACKEND_DIR/$ROUTES_FILE"; then
    echo "⚠️  Rota change-password já existe no arquivo de rotas"
else
    echo "📝 Adicionando rota change-password..."
    echo ""
    echo "⚠️  ATENÇÃO: Você precisa adicionar manualmente a rota no arquivo:"
    echo "   $BACKEND_DIR/$ROUTES_FILE"
    echo ""
    echo "Adicione dentro do grupo Route::middleware('auth:sanctum')->group(function () {"
    echo "   Route::post('/change-password', [ChangePasswordController::class, 'changePassword']);"
    echo ""
fi

# 3. Limpar cache
echo "🧹 Limpando cache do Laravel..."
cd "$BACKEND_DIR"
sudo php artisan route:clear
sudo php artisan config:clear
sudo php artisan cache:clear

echo ""
echo "✅ Instalação concluída!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Verifique se a rota foi adicionada em $ROUTES_FILE"
echo "   2. Teste o endpoint com:"
echo "      curl -X POST https://gateway.lacosapp.com/api/change-password \\"
echo "        -H 'Authorization: Bearer SEU_TOKEN' \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"current_password\":\"senha_atual\",\"new_password\":\"nova_senha\",\"new_password_confirmation\":\"nova_senha\"}'"




