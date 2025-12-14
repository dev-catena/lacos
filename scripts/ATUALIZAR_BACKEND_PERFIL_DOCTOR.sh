#!/bin/bash

echo "🔧 Atualizando backend para aceitar perfil 'doctor'..."
echo ""

cd /var/www/lacos-backend || exit 1

# 1. Atualizar AuthController
echo "📝 Atualizando AuthController..."
AUTH_CONTROLLER="app/Http/Controllers/Api/AuthController.php"
AUTH_BACKUP="${AUTH_CONTROLLER}.bak.$(date +%Y%m%d_%H%M%S)"

sudo cp "$AUTH_CONTROLLER" "$AUTH_BACKUP"
echo "✅ Backup criado: $AUTH_BACKUP"

# Atualizar validação do profile
sudo sed -i "s/'profile' => 'nullable|in:caregiver,accompanied,professional_caregiver'/'profile' => 'nullable|in:caregiver,accompanied,professional_caregiver,doctor'/" "$AUTH_CONTROLLER"

# Verificar se foi atualizado
if grep -q "professional_caregiver,doctor" "$AUTH_CONTROLLER"; then
    echo "✅ AuthController atualizado"
else
    echo "❌ Erro ao atualizar AuthController"
    sudo cp "$AUTH_BACKUP" "$AUTH_CONTROLLER"
    exit 1
fi
echo ""

# 2. Atualizar banco de dados - adicionar 'doctor' ao ENUM
echo "📝 Atualizando banco de dados..."
DB_NAME="lacos"
DB_USER="lacos"
DB_PASS="Lacos2025Secure"

mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "ALTER TABLE users MODIFY COLUMN profile ENUM('caregiver', 'accompanied', 'professional_caregiver', 'doctor') NULL;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Banco de dados atualizado"
else
    echo "⚠️  Erro ao atualizar banco de dados (pode ser que já esteja atualizado)"
fi
echo ""

# 3. Verificar se a coluna foi atualizada
echo "🔍 Verificando coluna profile..."
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW COLUMNS FROM users LIKE 'profile';" 2>/dev/null | grep -q "doctor" && echo "✅ Coluna profile aceita 'doctor'" || echo "⚠️  Verifique manualmente a coluna profile"
echo ""

# 4. Limpar cache
echo "🧹 Limpando cache..."
php artisan optimize:clear > /dev/null 2>&1
php artisan config:clear > /dev/null 2>&1
php artisan cache:clear > /dev/null 2>&1
echo "✅ Cache limpo"
echo ""

echo "✅ Concluído!"
echo ""
echo "📋 Resumo:"
echo "   - AuthController atualizado para aceitar 'doctor'"
echo "   - Banco de dados atualizado (ENUM profile)"
echo "   - Cache limpo"
echo ""

