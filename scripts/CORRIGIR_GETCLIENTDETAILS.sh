#!/bin/bash

# Script para corrigir o método getClientDetails removendo dependência da tabela reviews

set -e

cd /var/www/lacos-backend

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

echo "🔧 Corrigindo método getClientDetails..."
echo ""

# Fazer backup
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup: $BACKUP_FILE"
echo ""

# Encontrar a linha onde começa a busca de reviews
REVIEWS_START=$(grep -n "// Buscar reviews" "$CONTROLLER_FILE" | cut -d: -f1)

if [ -z "$REVIEWS_START" ]; then
    echo "❌ Não foi possível encontrar a seção de reviews"
    exit 1
fi

# Encontrar a linha onde termina a seção de reviews (antes do $clientData)
CLIENT_DATA_START=$(grep -n "\$clientData = \[" "$CONTROLLER_FILE" | cut -d: -f1)

if [ -z "$CLIENT_DATA_START" ]; then
    echo "❌ Não foi possível encontrar a seção de clientData"
    exit 1
fi

echo "📝 Substituindo seção de reviews (linhas $REVIEWS_START até $((CLIENT_DATA_START - 1)))..."
echo ""

# Criar novo código para reviews que trata erro caso a tabela não exista
cat > /tmp/reviews_section.txt << 'REVIEWS_EOF'
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

# Remover a seção antiga e inserir a nova
sudo sed -i "${REVIEWS_START},$((CLIENT_DATA_START - 1))d" "$CONTROLLER_FILE"
sudo sed -i "${REVIEWS_START}i\\$(cat /tmp/reviews_section.txt)" "$CONTROLLER_FILE"

rm /tmp/reviews_section.txt

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

