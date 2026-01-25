#!/bin/bash

# Script para executar no servidor
# Aplica todas as mudanças de CPF/Email

BACKEND_DIR="/var/www/lacos-backend"
TMP_DIR="/tmp"

echo "🔧 Aplicando mudanças de CPF/Email no servidor..."
echo ""

cd "$BACKEND_DIR" || exit 1

# 1. Aplicar migração
echo "1️⃣ Aplicando migração do CPF..."
if [ -f "$TMP_DIR/add_cpf_to_users_table.php" ]; then
    # Copiar migração para o diretório de migrations
    MIGRATION_NAME="$(date +%Y_%m_%d_%H%M%S)_add_cpf_to_users_table.php"
    sudo cp "$TMP_DIR/add_cpf_to_users_table.php" "database/migrations/$MIGRATION_NAME"
    
    # Aplicar migração
    php artisan migrate --path="database/migrations/$MIGRATION_NAME"
    
    if [ $? -eq 0 ]; then
        echo "✅ Migração aplicada com sucesso"
    else
        echo "❌ Erro ao aplicar migração"
        exit 1
    fi
else
    echo "❌ Arquivo de migração não encontrado em $TMP_DIR"
    exit 1
fi

# 2. Fazer backup e substituir AuthController
echo ""
echo "2️⃣ Substituindo AuthController..."
if [ -f "$TMP_DIR/AuthController_MODIFICADO_CPF_EMAIL.php" ]; then
    # Fazer backup
    if [ -f "app/Http/Controllers/Api/AuthController.php" ]; then
        BACKUP_NAME="AuthController.php.bak.$(date +%Y%m%d_%H%M%S)"
        sudo cp app/Http/Controllers/Api/AuthController.php "app/Http/Controllers/Api/$BACKUP_NAME"
        echo "✅ Backup criado: $BACKUP_NAME"
    fi
    
    # Copiar versão modificada
    sudo cp "$TMP_DIR/AuthController_MODIFICADO_CPF_EMAIL.php" app/Http/Controllers/Api/AuthController.php
    echo "✅ AuthController substituído"
else
    echo "❌ Arquivo AuthController_MODIFICADO_CPF_EMAIL.php não encontrado em $TMP_DIR"
    exit 1
fi

# 3. Adicionar rota para login com perfil
echo ""
echo "3️⃣ Adicionando rota /login/select-profile..."
ROUTES_FILE="routes/api.php"

# Verificar se a rota já existe
if grep -q "login/select-profile" "$ROUTES_FILE"; then
    echo "⚠️ Rota /login/select-profile já existe"
else
    # Verificar se AuthController está importado
    if ! grep -q "use App\\Http\\Controllers\\Api\\AuthController;" "$ROUTES_FILE"; then
        # Adicionar import no topo do arquivo
        sudo sed -i "1i use App\\Http\\Controllers\\Api\\AuthController;" "$ROUTES_FILE"
    fi
    
    # Encontrar onde adicionar a rota (após a rota de login)
    if grep -q "Route::post.*'/login'" "$ROUTES_FILE"; then
        # Adicionar após a rota de login
        sudo sed -i "/Route::post.*'\/login'/a\\    Route::post('/login/select-profile', [AuthController::class, 'loginWithProfile']);" "$ROUTES_FILE"
        echo "✅ Rota adicionada após /login"
    else
        # Adicionar no final do arquivo
        echo "" | sudo tee -a "$ROUTES_FILE" > /dev/null
        echo "Route::post('/login/select-profile', [AuthController::class, 'loginWithProfile']);" | sudo tee -a "$ROUTES_FILE" > /dev/null
        echo "✅ Rota adicionada no final do arquivo"
    fi
fi

# 4. Limpar cache
echo ""
echo "4️⃣ Limpando cache do Laravel..."
php artisan config:clear
php artisan route:clear
php artisan cache:clear
echo "✅ Cache limpo"

echo ""
echo "✅ Todas as mudanças foram aplicadas com sucesso!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Testar registro de médico com CPF"
echo "   2. Testar login com CPF (médico) e Email (outros perfis)"
echo "   3. Testar múltiplos perfis com mesmo email"















