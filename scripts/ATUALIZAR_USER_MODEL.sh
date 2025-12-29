#!/bin/bash

echo "🔧 Atualizando Model User com novos campos..."
echo ""

cd /var/www/lacos-backend || exit 1

MODEL_FILE="app/Models/User.php"
BACKUP_FILE="${MODEL_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

# 1. Fazer backup
echo "📦 Criando backup..."
sudo cp "$MODEL_FILE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# 2. Copiar novo modelo
echo "📝 Copiando modelo atualizado..."
sudo cp /tmp/User_MODEL_ATUALIZADO.php "$MODEL_FILE"
sudo chown www-data:www-data "$MODEL_FILE"
echo "✅ Modelo atualizado"
echo ""

# 3. Verificar sintaxe PHP
echo "🔍 Verificando sintaxe PHP..."
if php -l "$MODEL_FILE" > /dev/null 2>&1; then
    echo "✅ Sintaxe PHP válida"
else
    echo "❌ Erro de sintaxe detectado"
    php -l "$MODEL_FILE"
    echo ""
    echo "🔄 Restaurando backup..."
    sudo cp "$BACKUP_FILE" "$MODEL_FILE"
    exit 1
fi
echo ""

# 4. Verificar campos adicionados
echo "📋 Verificando campos no fillable..."
FIELDS=("last_name" "cpf" "address" "address_number" "address_complement" "state" "zip_code")
for field in "${FIELDS[@]}"; do
    if grep -q "'$field'" "$MODEL_FILE"; then
        echo "✅ Campo $field encontrado"
    else
        echo "❌ Campo $field NÃO encontrado"
    fi
done
echo ""

# 5. Limpar cache
echo "🧹 Limpando cache..."
php artisan optimize:clear > /dev/null 2>&1
php artisan config:clear > /dev/null 2>&1
php artisan cache:clear > /dev/null 2>&1
echo "✅ Cache limpo"
echo ""

echo "✅ Modelo User atualizado com sucesso!"
echo ""
echo "📋 Resumo:"
echo "   - Backup: $BACKUP_FILE"
echo "   - Campos adicionados: last_name, cpf, address, address_number, address_complement, state, zip_code"
echo "   - Sintaxe verificada e válida"
echo ""

