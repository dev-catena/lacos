#!/bin/bash

echo "🔧 Adicionando imports Auth e Log..."
echo ""

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"

# Verificar imports atuais
echo "📝 Imports atuais relacionados a Facades:"
grep "Facades" "$CONTROLLER_FILE" || echo "Nenhum import de Facades encontrado"
echo ""

# Encontrar linha do DB (tentar diferentes padrões)
DB_LINE=$(grep -n "Facades.*DB" "$CONTROLLER_FILE" | head -1 | cut -d: -f1)

if [ -z "$DB_LINE" ]; then
    # Tentar encontrar qualquer linha com DB
    DB_LINE=$(grep -n "use.*DB" "$CONTROLLER_FILE" | head -1 | cut -d: -f1)
fi

if [ -z "$DB_LINE" ]; then
    echo "❌ Não foi possível encontrar a linha do DB"
    echo "📝 Tentando adicionar após a última linha 'use Illuminate'..."
    # Encontrar última linha com use Illuminate
    LAST_ILLUMINATE=$(grep -n "^use Illuminate" "$CONTROLLER_FILE" | tail -1 | cut -d: -f1)
    if [ -n "$LAST_ILLUMINATE" ]; then
        DB_LINE="$LAST_ILLUMINATE"
        echo "✅ Usando linha $DB_LINE como referência"
    else
        echo "❌ Não foi possível encontrar linha de referência"
        exit 1
    fi
else
    echo "✅ Linha do DB encontrada: $DB_LINE"
fi

echo ""

# Verificar se Auth já existe
if grep -q "Facades.*Auth" "$CONTROLLER_FILE"; then
    echo "✅ Use Auth já existe"
else
    echo "📝 Adicionando use Auth após linha $DB_LINE..."
    sudo sed -i "${DB_LINE}a\\use Illuminate\\Support\\Facades\\Auth;" "$CONTROLLER_FILE"
    echo "✅ Use Auth adicionado"
    # Atualizar linha
    DB_LINE=$((DB_LINE + 1))
fi

# Verificar se Log já existe
if grep -q "Facades.*Log" "$CONTROLLER_FILE"; then
    echo "✅ Use Log já existe"
else
    # Encontrar linha do Auth ou usar DB_LINE
    AUTH_LINE=$(grep -n "Facades.*Auth" "$CONTROLLER_FILE" | head -1 | cut -d: -f1)
    if [ -z "$AUTH_LINE" ]; then
        AUTH_LINE=$DB_LINE
    fi
    echo "📝 Adicionando use Log após linha $AUTH_LINE..."
    sudo sed -i "${AUTH_LINE}a\\use Illuminate\\Support\\Facades\\Log;" "$CONTROLLER_FILE"
    echo "✅ Use Log adicionado"
fi

echo ""
echo "📝 Imports após adição:"
echo "=========================================="
grep "Facades" "$CONTROLLER_FILE"
echo "=========================================="
echo ""

# Verificar sintaxe
echo "🔍 Verificando sintaxe..."
if php -l "$CONTROLLER_FILE" > /dev/null 2>&1; then
    echo "✅ Sintaxe PHP válida"
else
    echo "❌ Erro de sintaxe:"
    php -l "$CONTROLLER_FILE"
    exit 1
fi

# Limpar cache
echo ""
echo "🧹 Limpando cache..."
php artisan route:clear > /dev/null 2>&1
php artisan config:clear > /dev/null 2>&1
php artisan cache:clear > /dev/null 2>&1
echo "✅ Cache limpo"
echo ""

echo "✅ Imports adicionados com sucesso!"


