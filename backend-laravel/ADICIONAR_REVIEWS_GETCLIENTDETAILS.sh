#!/bin/bash

# Script para adicionar seção de reviews no método getClientDetails

set -e

cd /var/www/lacos-backend

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

echo "🔧 Adicionando seção de reviews no método getClientDetails..."
echo ""

# Fazer backup
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup: $BACKUP_FILE"
echo ""

# Encontrar linha onde começa "$clientData ="
CLIENT_DATA_LINE=$(grep -n "^\s*\$clientData = \[" "$CONTROLLER_FILE" | head -1 | cut -d: -f1)

if [ -z "$CLIENT_DATA_LINE" ]; then
    echo "❌ Não foi possível encontrar a linha de clientData"
    exit 1
fi

echo "📝 Adicionando código de reviews antes da linha $CLIENT_DATA_LINE..."
echo ""

# Criar código de reviews
REVIEWS_CODE="            // Buscar reviews (se a tabela existir)
            \$reviews = collect([]);
            \$rating = 0;
            
            try {
                if (DB::getSchemaBuilder()->hasTable('reviews')) {
                    \$reviews = DB::table('reviews')
                        ->where('reviewed_user_id', \$id)
                        ->select('id', 'rating', 'comment', 'created_at')
                        ->orderBy('created_at', 'desc')
                        ->get();

                    \$ratingResult = DB::table('reviews')
                        ->where('reviewed_user_id', \$id)
                        ->avg('rating');
                    
                    \$rating = \$ratingResult ? round(\$ratingResult, 1) : 0;
                }
            } catch (\\Exception \$e) {
                // Se a tabela reviews não existir ou houver erro, usar valores padrão
                \\Log::warning('Erro ao buscar reviews em getClientDetails: ' . \$e->getMessage());
                \$reviews = collect([]);
                \$rating = 0;
            }
"

# Inserir código antes de $clientData
sudo sed -i "${CLIENT_DATA_LINE}i\\${REVIEWS_CODE}" "$CONTROLLER_FILE"

echo "✅ Código de reviews adicionado"
echo ""

# Verificar sintaxe
echo "🔍 Verificando sintaxe PHP..."
if php -l "$CONTROLLER_FILE" > /dev/null 2>&1; then
    echo "✅ Sintaxe PHP válida"
else
    echo "❌ Erro de sintaxe:"
    php -l "$CONTROLLER_FILE"
    echo ""
    echo "🔄 Restaurando backup..."
    sudo cp "$BACKUP_FILE" "$CONTROLLER_FILE"
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

echo "✅ Correção concluída!"

