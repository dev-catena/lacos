#!/bin/bash

echo "🔧 Atualizando backend para suportar doenças crônicas e alergias..."
echo ""

cd /var/www/lacos-backend || exit 1

# Criar backup
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
sudo cp app/Models/User.php "$BACKUP_DIR/User.php.bak"
sudo cp app/Http/Controllers/Api/UserController.php "$BACKUP_DIR/UserController.php.bak"
echo "✅ Backups criados em $BACKUP_DIR"
echo ""

# Adicionar colunas no banco
echo "📝 Adicionando colunas no banco de dados..."
bash /tmp/ADICIONAR_COLUNAS_DOENCAS_ALERGIAS.sh

# Atualizar User Model
echo "📝 Atualizando User Model..."
sudo cp /tmp/User_MODEL_COM_DOENCAS_ALERGIAS.php app/Models/User.php
sudo chown www-data:www-data app/Models/User.php
echo "✅ User Model atualizado"
echo ""

# Atualizar UserController
echo "📝 Atualizando UserController..."
sudo cp /tmp/UserController_COM_DOENCAS_ALERGIAS.php app/Http/Controllers/Api/UserController.php
sudo chown www-data:www-data app/Http/Controllers/Api/UserController.php
echo "✅ UserController atualizado"
echo ""

# Verificar sintaxe
echo "🔍 Verificando sintaxe PHP..."
if php -l app/Models/User.php > /dev/null 2>&1; then
    echo "✅ User Model: sintaxe válida"
else
    echo "❌ Erro de sintaxe no User Model"
    php -l app/Models/User.php
    exit 1
fi

if php -l app/Http/Controllers/Api/UserController.php > /dev/null 2>&1; then
    echo "✅ UserController: sintaxe válida"
else
    echo "❌ Erro de sintaxe no UserController"
    php -l app/Http/Controllers/Api/UserController.php
    exit 1
fi

# Limpar cache
echo ""
echo "🧹 Limpando cache..."
php artisan optimize:clear > /dev/null 2>&1
echo "✅ Cache limpo"
echo ""

echo "✅ Concluído!"
echo ""
echo "📋 Resumo:"
echo "   - Colunas chronic_diseases e allergies adicionadas ao banco"
echo "   - User Model atualizado"
echo "   - UserController atualizado"
echo "   - Cache limpo"
echo ""

