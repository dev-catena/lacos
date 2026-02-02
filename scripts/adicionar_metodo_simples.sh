#!/bin/bash
# Execute este script NO SERVIDOR (10.102.0.103)

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"

# Fazer backup
sudo cp "$CONTROLLER_FILE" "${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

# Adicionar import se não existir
if ! grep -q "use App\\Models\\CaregiverReview;" "$CONTROLLER_FILE"; then
    # Encontrar última linha de import de Models
    LAST_MODEL=$(grep -n "use App\\Models\\" "$CONTROLLER_FILE" | tail -1 | cut -d: -f1)
    if [ -n "$LAST_MODEL" ]; then
        sudo sed -i "${LAST_MODEL}a use App\\Models\\CaregiverReview;" "$CONTROLLER_FILE"
    else
        # Se não houver imports de Models, adicionar após namespace
        NAMESPACE_LINE=$(grep -n "^namespace" "$CONTROLLER_FILE" | head -1 | cut -d: -f1)
        sudo sed -i "${NAMESPACE_LINE}a use App\\Models\\CaregiverReview;" "$CONTROLLER_FILE"
    fi
fi

# Encontrar última linha antes do fechamento da classe
TOTAL_LINES=$(wc -l < "$CONTROLLER_FILE")
LAST_CLOSING=$(grep -n "^}" "$CONTROLLER_FILE" | tail -1 | cut -d: -f1)
INSERT_LINE=$((LAST_CLOSING - 1))

# Criar método
METHOD_CODE='    /**
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
    }'

# Adicionar método antes do último }
sudo sed -i "${INSERT_LINE}a\\${METHOD_CODE}" "$CONTROLLER_FILE"

# Verificar sintaxe
if php -l "$CONTROLLER_FILE" > /dev/null 2>&1; then
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
    php -l "$CONTROLLER_FILE"
    echo ""
    echo "⚠️  Restaurando backup..."
    sudo cp "${CONTROLLER_FILE}.bak."* "$CONTROLLER_FILE" 2>/dev/null
    exit 1
fi

