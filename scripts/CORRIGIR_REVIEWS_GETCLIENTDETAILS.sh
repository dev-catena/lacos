#!/bin/bash

# Script para corrigir o método getClientDetails removendo dependência da tabela reviews

set -e

cd /var/www/lacos-backend

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

echo "🔧 Corrigindo método getClientDetails para tratar tabela reviews..."
echo ""

# Fazer backup
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup: $BACKUP_FILE"
echo ""

# Criar arquivo temporário com o código corrigido
cat > /tmp/reviews_code.php << 'REVIEWS_EOF'
            // Buscar reviews (se a tabela existir)
            $reviews = collect([]);
            $rating = 0;
            
            try {
                if (DB::getSchemaBuilder()->hasTable('reviews')) {
                    $reviews = DB::table('reviews')
                        ->where('reviewed_user_id', $id)
                        ->select('id', 'rating', 'comment', 'created_at')
                        ->orderBy('created_at', 'desc')
                        ->get();

                    $ratingResult = DB::table('reviews')
                        ->where('reviewed_user_id', $id)
                        ->avg('rating');
                    
                    $rating = $ratingResult ? round($ratingResult, 1) : 0;
                }
            } catch (\Exception $e) {
                // Se a tabela reviews não existir ou houver erro, usar valores padrão
                \Log::warning('Erro ao buscar reviews em getClientDetails: ' . $e->getMessage());
                $reviews = collect([]);
                $rating = 0;
            }
REVIEWS_EOF

# Encontrar linha onde começa "// Buscar reviews"
REVIEWS_LINE=$(grep -n "// Buscar reviews" "$CONTROLLER_FILE" | cut -d: -f1)

if [ -z "$REVIEWS_LINE" ]; then
    echo "❌ Não foi possível encontrar a seção de reviews"
    exit 1
fi

# Encontrar linha onde começa "$rating ="
RATING_LINE=$(grep -n "^\s*\$rating = DB::table" "$CONTROLLER_FILE" | head -1 | cut -d: -f1)

if [ -z "$RATING_LINE" ]; then
    echo "❌ Não foi possível encontrar a linha de rating"
    exit 1
fi

# Encontrar linha onde começa "$clientData ="
CLIENT_DATA_LINE=$(grep -n "^\s*\$clientData = \[" "$CONTROLLER_FILE" | head -1 | cut -d: -f1)

if [ -z "$CLIENT_DATA_LINE" ]; then
    echo "❌ Não foi possível encontrar a linha de clientData"
    exit 1
fi

echo "📝 Substituindo seção de reviews (linhas $REVIEWS_LINE até $((CLIENT_DATA_LINE - 1)))..."
echo ""

# Criar novo arquivo temporário
TEMP_FILE=$(mktemp)

# Copiar até a linha antes de reviews
head -n $((REVIEWS_LINE - 1)) "$CONTROLLER_FILE" > "$TEMP_FILE"

# Adicionar novo código de reviews
cat /tmp/reviews_code.php >> "$TEMP_FILE"

# Copiar a partir da linha clientData
tail -n +$CLIENT_DATA_LINE "$CONTROLLER_FILE" >> "$TEMP_FILE"

# Substituir arquivo original
sudo cp "$TEMP_FILE" "$CONTROLLER_FILE"
rm "$TEMP_FILE"
rm /tmp/reviews_code.php

echo "✅ Seção de reviews corrigida"
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

