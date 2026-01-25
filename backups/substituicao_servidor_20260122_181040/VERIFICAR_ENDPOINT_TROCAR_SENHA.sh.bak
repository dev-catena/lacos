#!/bin/bash

# Script para verificar se o endpoint de trocar senha está instalado

BACKEND_DIR="/var/www/lacos-backend"
CONTROLLER_PATH="$BACKEND_DIR/app/Http/Controllers/Api/ChangePasswordController.php"
ROUTES_FILE="$BACKEND_DIR/routes/api.php"

echo "🔍 Verificando instalação do endpoint de trocar senha..."
echo ""

# Verificar controller
if [ -f "$CONTROLLER_PATH" ]; then
    echo "✅ Controller encontrado: $CONTROLLER_PATH"
    echo "   Permissões: $(ls -l "$CONTROLLER_PATH" | awk '{print $1, $3, $4}')"
else
    echo "❌ Controller NÃO encontrado: $CONTROLLER_PATH"
    echo "   Execute: sudo cp ChangePasswordController.php $CONTROLLER_PATH"
fi

echo ""

# Verificar rota
if grep -q "change-password" "$ROUTES_FILE"; then
    echo "✅ Rota encontrada no arquivo de rotas"
    echo "   Linha:"
    grep -n "change-password" "$ROUTES_FILE" | head -1
else
    echo "❌ Rota NÃO encontrada no arquivo de rotas"
    echo "   Adicione em $ROUTES_FILE:"
    echo "   Route::post('/change-password', [ChangePasswordController::class, 'changePassword']);"
fi

echo ""

# Verificar se o use está no topo do arquivo
if grep -q "use App\\Http\\Controllers\\Api\\ChangePasswordController" "$ROUTES_FILE"; then
    echo "✅ Import do ChangePasswordController encontrado"
else
    echo "⚠️  Import do ChangePasswordController NÃO encontrado"
    echo "   Adicione no topo de $ROUTES_FILE:"
    echo "   use App\\Http\\Controllers\\Api\\ChangePasswordController;"
fi

echo ""
echo "📝 Para testar o endpoint:"
echo "   curl -X POST https://gateway.lacosapp.com/api/change-password \\"
echo "     -H 'Authorization: Bearer SEU_TOKEN' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"current_password\":\"senha_atual\",\"new_password\":\"nova_senha\",\"new_password_confirmation\":\"nova_senha\"}'"




