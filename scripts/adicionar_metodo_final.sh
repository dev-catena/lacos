#!/bin/bash
# Execute este script NO SERVIDOR (193.203.182.22)

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"

echo "🔧 Adicionando método createClientReview..."
echo ""

# Fazer backup
BACKUP="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"
sudo cp "$CONTROLLER_FILE" "$BACKUP"
echo "✅ Backup criado: $BACKUP"
echo ""

# Criar arquivo temporário com o método
TEMP_METHOD="/tmp/createClientReview_method.txt"
cat > "$TEMP_METHOD" << 'EOF'
    /**
     * Criar avaliação de um cliente
     */
    public function createClientReview(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            $validated = $request->validate([
                "rating" => "required|integer|min:1|max:5",
                "comment" => "required|string|min:10|max:500",
            ]);
            
            $client = User::find($id);
            if (!$client) {
                return response()->json([
                    "success" => false,
                    "message" => "Cliente não encontrado",
                ], 404);
            }
            
            $userGroups = $user->groups()->pluck("groups.id")->toArray();
            $clientGroups = $client->groups()->pluck("groups.id")->toArray();
            $commonGroups = array_intersect($userGroups, $clientGroups);
            
            if (empty($commonGroups)) {
                return response()->json([
                    "success" => false,
                    "message" => "Você não tem permissão para avaliar este cliente",
                ], 403);
            }
            
            $groupId = $commonGroups[0];
            
            $existingReview = CaregiverReview::where("caregiver_id", $user->id)
                ->where("author_id", $client->id)
                ->where("group_id", $groupId)
                ->first();
            
            if ($existingReview) {
                $existingReview->update([
                    "rating" => $validated["rating"],
                    "comment" => $validated["comment"],
                ]);
                
                return response()->json([
                    "success" => true,
                    "message" => "Avaliação atualizada com sucesso",
                    "review" => $existingReview->load(["caregiver", "author"]),
                ]);
            }
            
            $review = CaregiverReview::create([
                "caregiver_id" => $user->id,
                "author_id" => $client->id,
                "group_id" => $groupId,
                "rating" => $validated["rating"],
                "comment" => $validated["comment"],
            ]);
            
            return response()->json([
                "success" => true,
                "message" => "Avaliação criada com sucesso",
                "review" => $review->load(["caregiver", "author"]),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                "success" => false,
                "message" => "Dados inválidos",
                "errors" => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error("Erro ao criar avaliação de cliente", [
                "error" => $e->getMessage(),
                "trace" => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                "success" => false,
                "message" => "Server Error",
            ], 500);
        }
    }
EOF

# Adicionar import se não existir
if ! grep -q "use App\\Models\\CaregiverReview;" "$CONTROLLER_FILE"; then
    echo "📝 Adicionando import do CaregiverReview..."
    LAST_MODEL=$(grep -n "use App\\Models\\" "$CONTROLLER_FILE" | tail -1 | cut -d: -f1)
    if [ -n "$LAST_MODEL" ]; then
        sudo sed -i "${LAST_MODEL}a use App\\Models\\CaregiverReview;" "$CONTROLLER_FILE"
    else
        NAMESPACE_LINE=$(grep -n "^namespace" "$CONTROLLER_FILE" | head -1 | cut -d: -f1)
        sudo sed -i "${NAMESPACE_LINE}a use App\\Models\\CaregiverReview;" "$CONTROLLER_FILE"
    fi
    echo "✅ Import adicionado"
fi
echo ""

# Encontrar onde inserir (antes do último })
LAST_CLOSING=$(grep -n "^}" "$CONTROLLER_FILE" | tail -1 | cut -d: -f1)
INSERT_LINE=$((LAST_CLOSING - 1))

echo "📍 Inserindo método antes da linha $LAST_CLOSING"
echo ""

# Criar novo arquivo com o método inserido
TEMP_CONTROLLER="/tmp/CaregiverController_new.php"
head -n "$INSERT_LINE" "$CONTROLLER_FILE" > "$TEMP_CONTROLLER"
echo "" >> "$TEMP_CONTROLLER"
cat "$TEMP_METHOD" >> "$TEMP_CONTROLLER"
tail -n +$((INSERT_LINE + 1)) "$CONTROLLER_FILE" >> "$TEMP_CONTROLLER"

# Verificar sintaxe
echo "🔍 Verificando sintaxe PHP..."
if php -l "$TEMP_CONTROLLER" > /dev/null 2>&1; then
    sudo cp "$TEMP_CONTROLLER" "$CONTROLLER_FILE"
    sudo chown www-data:www-data "$CONTROLLER_FILE"
    rm -f "$TEMP_METHOD" "$TEMP_CONTROLLER"
    echo "✅ Método adicionado com sucesso!"
    echo ""
    echo "Verificando:"
    grep -n "createClientReview" "$CONTROLLER_FILE"
    echo ""
    echo "🧹 Limpando cache..."
    php artisan route:clear > /dev/null 2>&1
    php artisan config:clear > /dev/null 2>&1
    php artisan cache:clear > /dev/null 2>&1
    echo "✅ Cache limpo"
    echo ""
    echo "🎯 Agora teste a avaliação no app!"
else
    echo "❌ Erro de sintaxe:"
    php -l "$TEMP_CONTROLLER"
    echo ""
    echo "⚠️  Restaurando backup..."
    sudo cp "$BACKUP" "$CONTROLLER_FILE"
    rm -f "$TEMP_METHOD" "$TEMP_CONTROLLER"
    exit 1
fi

