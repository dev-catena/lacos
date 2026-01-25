#!/bin/bash

# Script simples para inserir código de reviews

set -e

cd /var/www/lacos-backend

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

echo "🔧 Inserindo código de reviews..."
echo ""

# Fazer backup
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup: $BACKUP_FILE"
echo ""

# Verificar se já existe
if grep -q "// Buscar reviews (se a tabela existir)" "$CONTROLLER_FILE"; then
    echo "✅ Código de reviews já existe"
    exit 0
fi

# Encontrar linha com $clientData = [ (não patientData)
CLIENT_DATA_LINE=$(grep -n '\$clientData = \[' "$CONTROLLER_FILE" | grep -v 'patientData' | head -1 | cut -d: -f1)

if [ -z "$CLIENT_DATA_LINE" ]; then
    echo "❌ Não foi possível encontrar \$clientData"
    exit 1
fi

echo "📝 Inserindo código na linha $CLIENT_DATA_LINE..."
echo ""

# Criar arquivo temporário com o código
cat > /tmp/reviews_insert.txt << 'EOF'
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

EOF

# Inserir antes da linha
INSERT_LINE=$((CLIENT_DATA_LINE - 1))
sudo sed -i "${INSERT_LINE}r /tmp/reviews_insert.txt" "$CONTROLLER_FILE"
rm /tmp/reviews_insert.txt

echo "✅ Código inserido"
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

