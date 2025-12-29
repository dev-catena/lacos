#!/bin/bash

# Script para executar no servidor
# Aplica suporte a assinatura digital .apx

BACKEND_DIR="/var/www/lacos-backend"
TMP_DIR="/tmp"

echo "🔧 Aplicando suporte a assinatura digital .apx..."
echo ""

cd "$BACKEND_DIR" || exit 1

# 1. Aplicar migração
echo "1️⃣ Aplicando migração do certificado .apx..."
if [ -f "$TMP_DIR/add_certificate_apx_to_users.php" ]; then
    MIGRATION_NAME="$(date +%Y_%m_%d_%H%M%S)_add_certificate_apx_to_users.php"
    sudo cp "$TMP_DIR/add_certificate_apx_to_users.php" "database/migrations/$MIGRATION_NAME"
    
    php artisan migrate --path="database/migrations/$MIGRATION_NAME"
    
    if [ $? -eq 0 ]; then
        echo "✅ Migração aplicada com sucesso"
    else
        echo "❌ Erro ao aplicar migração"
        exit 1
    fi
else
    echo "❌ Arquivo de migração não encontrado"
    exit 1
fi

# 2. Substituir CertificateController
echo ""
echo "2️⃣ Substituindo CertificateController..."
if [ -f "$TMP_DIR/CertificateController_APX.php" ]; then
    # Fazer backup
    if [ -f "app/Http/Controllers/Api/CertificateController.php" ]; then
        BACKUP_NAME="CertificateController.php.bak.$(date +%Y%m%d_%H%M%S)"
        sudo cp app/Http/Controllers/Api/CertificateController.php "app/Http/Controllers/Api/$BACKUP_NAME"
        echo "✅ Backup criado: $BACKUP_NAME"
    fi
    
    # Copiar versão modificada
    sudo cp "$TMP_DIR/CertificateController_APX.php" app/Http/Controllers/Api/CertificateController.php
    echo "✅ CertificateController substituído"
else
    echo "❌ Arquivo CertificateController_APX.php não encontrado"
    exit 1
fi

# 3. Substituir DigitalSignatureService
echo ""
echo "3️⃣ Substituindo DigitalSignatureService..."
if [ -f "$TMP_DIR/DigitalSignatureService_APX.php" ]; then
    # Criar diretório Services se não existir
    sudo mkdir -p app/Services
    
    # Fazer backup
    if [ -f "app/Services/DigitalSignatureService.php" ]; then
        BACKUP_NAME="DigitalSignatureService.php.bak.$(date +%Y%m%d_%H%M%S)"
        sudo cp app/Services/DigitalSignatureService.php "app/Services/$BACKUP_NAME"
        echo "✅ Backup criado: $BACKUP_NAME"
    fi
    
    # Copiar versão modificada
    sudo cp "$TMP_DIR/DigitalSignatureService_APX.php" app/Services/DigitalSignatureService.php
    echo "✅ DigitalSignatureService substituído"
else
    echo "❌ Arquivo DigitalSignatureService_APX.php não encontrado"
    exit 1
fi

# 4. Adicionar rotas de certificado se não existirem
echo ""
echo "4️⃣ Verificando rotas de certificado..."
ROUTES_FILE="routes/api.php"

if ! grep -q "certificate/upload" "$ROUTES_FILE"; then
    echo "   Adicionando rotas de certificado..."
    
    # Adicionar import se não existir
    if ! grep -q "use App\\Http\\Controllers\\Api\\CertificateController;" "$ROUTES_FILE"; then
        sudo sed -i "/use App\\Http\\Controllers\\Api\\AuthController;/a use App\\Http\\Controllers\\Api\\CertificateController;" "$ROUTES_FILE"
    fi
    
    # Adicionar rotas dentro do grupo autenticado
    if grep -q "Route::middleware('auth:sanctum')" "$ROUTES_FILE"; then
        sudo sed -i "/Route::middleware('auth:sanctum')/a\\    Route::post('/certificate/upload', [CertificateController::class, 'upload']);\\n    Route::delete('/certificate/remove', [CertificateController::class, 'remove']);" "$ROUTES_FILE"
        echo "✅ Rotas adicionadas"
    else
        echo "⚠️ Grupo de rotas autenticadas não encontrado, adicione manualmente:"
        echo "   Route::post('/certificate/upload', [CertificateController::class, 'upload']);"
        echo "   Route::delete('/certificate/remove', [CertificateController::class, 'remove']);"
    fi
else
    echo "✅ Rotas de certificado já existem"
fi

# 5. Limpar cache
echo ""
echo "5️⃣ Limpando cache do Laravel..."
php artisan config:clear
php artisan route:clear
php artisan cache:clear
echo "✅ Cache limpo"

echo ""
echo "✅ Todas as mudanças foram aplicadas com sucesso!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Médicos podem fazer upload de certificado .apx em Perfil > Segurança"
echo "   2. Certificado será usado para assinar atestados automaticamente"
echo "   3. Verificar logs em storage/logs/laravel.log se houver problemas"




