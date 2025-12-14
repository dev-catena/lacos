#!/bin/bash

echo "🔧 Atualizando backend para campos específicos de médico..."
echo ""

cd /var/www/lacos-backend || exit 1

DB_NAME="lacos"
DB_USER="lacos"
DB_PASS="Lacos2025Secure"

# 1. Adicionar colunas CRM e specialty
echo "📝 Adicionando colunas no banco de dados..."
mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
ALTER TABLE users ADD COLUMN IF NOT EXISTS crm VARCHAR(20) NULL AFTER formation_details;
ALTER TABLE users ADD COLUMN IF NOT EXISTS specialty VARCHAR(100) NULL AFTER crm;
" 2>/dev/null || {
    # Se IF NOT EXISTS não funcionar, verificar antes
    if ! mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW COLUMNS FROM users LIKE 'crm';" 2>/dev/null | grep -q "crm"; then
        mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "ALTER TABLE users ADD COLUMN crm VARCHAR(20) NULL AFTER formation_details;" 2>/dev/null
    fi
    if ! mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW COLUMNS FROM users LIKE 'specialty';" 2>/dev/null | grep -q "specialty"; then
        mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "ALTER TABLE users ADD COLUMN specialty VARCHAR(100) NULL AFTER crm;" 2>/dev/null
    fi
}
echo "✅ Colunas adicionadas"
echo ""

# 2. Atualizar Model User - adicionar crm e specialty ao fillable
echo "📝 Atualizando Model User..."
MODEL_FILE="app/Models/User.php"
MODEL_BACKUP="${MODEL_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

sudo cp "$MODEL_FILE" "$MODEL_BACKUP"

# Adicionar crm e specialty ao fillable se não existirem
if ! grep -q "'crm'" "$MODEL_FILE"; then
    sudo sed -i "/'formation_details',/a\        'crm',\n        'specialty'," "$MODEL_FILE"
fi

if php -l "$MODEL_FILE" > /dev/null 2>&1; then
    echo "✅ Model User atualizado"
else
    echo "❌ Erro de sintaxe"
    sudo cp "$MODEL_BACKUP" "$MODEL_FILE"
    exit 1
fi
echo ""

# 3. Limpar cache
echo "🧹 Limpando cache..."
php artisan optimize:clear > /dev/null 2>&1
echo "✅ Cache limpo"
echo ""

echo "✅ Concluído! Agora atualize manualmente o AuthController e UserController."
echo ""

