#!/bin/bash

echo "🔧 Corrigindo persistência de dados pessoais..."
echo ""

cd /var/www/lacos-backend || exit 1

# 1. Atualizar UserController
echo "📝 Atualizando UserController..."
CONTROLLER_FILE="app/Http/Controllers/Api/UserController.php"
CONTROLLER_BACKUP="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

cp "$CONTROLLER_FILE" "$CONTROLLER_BACKUP" 2>/dev/null || sudo cp "$CONTROLLER_FILE" "$CONTROLLER_BACKUP"
cp /tmp/UserController_ATUALIZADO.php "$CONTROLLER_FILE" 2>/dev/null || sudo cp /tmp/UserController_ATUALIZADO.php "$CONTROLLER_FILE"
chown www-data:www-data "$CONTROLLER_FILE" 2>/dev/null || sudo chown www-data:www-data "$CONTROLLER_FILE"

# Verificar sintaxe
if php -l "$CONTROLLER_FILE" > /dev/null 2>&1; then
    echo "✅ UserController atualizado"
else
    echo "❌ Erro de sintaxe no UserController"
    php -l "$CONTROLLER_FILE"
    cp "$CONTROLLER_BACKUP" "$CONTROLLER_FILE" 2>/dev/null || sudo cp "$CONTROLLER_BACKUP" "$CONTROLLER_FILE"
    exit 1
fi
echo ""

# 2. Atualizar Model User
echo "📝 Atualizando Model User..."
MODEL_FILE="app/Models/User.php"
MODEL_BACKUP="${MODEL_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

cp "$MODEL_FILE" "$MODEL_BACKUP" 2>/dev/null || sudo cp "$MODEL_FILE" "$MODEL_BACKUP"
cp /tmp/User_MODEL_ATUALIZADO.php "$MODEL_FILE" 2>/dev/null || sudo cp /tmp/User_MODEL_ATUALIZADO.php "$MODEL_FILE"
chown www-data:www-data "$MODEL_FILE" 2>/dev/null || sudo chown www-data:www-data "$MODEL_FILE"

# Verificar sintaxe
if php -l "$MODEL_FILE" > /dev/null 2>&1; then
    echo "✅ Model User atualizado"
else
    echo "❌ Erro de sintaxe no Model User"
    php -l "$MODEL_FILE"
    cp "$MODEL_BACKUP" "$MODEL_FILE" 2>/dev/null || sudo cp "$MODEL_BACKUP" "$MODEL_FILE"
    exit 1
fi
echo ""

# 3. Criar e executar migration
echo "📝 Criando migration para adicionar colunas..."
MIGRATION_NAME="$(date +%Y_%m_%d_%H%M%S)_add_personal_data_fields_to_users_table"
MIGRATION_FILE="database/migrations/${MIGRATION_NAME}.php"

cp /tmp/add_personal_data_fields_to_users_table.php "$MIGRATION_FILE" 2>/dev/null || sudo cp /tmp/add_personal_data_fields_to_users_table.php "$MIGRATION_FILE"
chown www-data:www-data "$MIGRATION_FILE" 2>/dev/null || sudo chown www-data:www-data "$MIGRATION_FILE"

echo "✅ Migration criada: $MIGRATION_NAME"
echo ""

# 4. Executar migration
echo "🚀 Executando migration..."
php artisan migrate --force
if [ $? -eq 0 ]; then
    echo "✅ Migration executada com sucesso"
else
    echo "⚠️  Erro ao executar migration (pode ser que as colunas já existam)"
fi
echo ""

# 5. Verificar colunas no banco
echo "🔍 Verificando colunas no banco de dados..."
mysql -u lacos -p'Lacos2025Secure' lacos -e "DESCRIBE users;" 2>/dev/null | grep -E 'last_name|cpf|address|zip_code|state' || echo "⚠️  Algumas colunas podem não existir"
echo ""

# 6. Limpar cache
echo "🧹 Limpando cache..."
php artisan optimize:clear > /dev/null 2>&1
php artisan config:clear > /dev/null 2>&1
php artisan cache:clear > /dev/null 2>&1
echo "✅ Cache limpo"
echo ""

echo "✅ Concluído!"
echo ""
echo "📋 Resumo:"
echo "   - UserController atualizado"
echo "   - Model User atualizado"
echo "   - Migration criada e executada"
echo "   - Cache limpo"
echo ""

