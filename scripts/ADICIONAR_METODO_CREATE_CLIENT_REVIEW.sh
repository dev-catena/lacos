#!/bin/bash

# Script para adicionar método createClientReview no servidor
# Execute este script NO SERVIDOR (10.102.0.103)

echo "🔧 Adicionando método createClientReview no CaregiverController..."
echo ""

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

# 1. Fazer backup
echo "📦 Criando backup..."
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# 2. Verificar se o método já existe
if grep -q "public function createClientReview" "$CONTROLLER_FILE"; then
    echo "⚠️  Método createClientReview já existe. Removendo versão anterior..."
    # Encontrar linha do método e remover até o próximo método ou fechamento da classe
    START_LINE=$(grep -n "public function createClientReview" "$CONTROLLER_FILE" | cut -d: -f1)
    # Encontrar o próximo método público ou fechamento da classe
    END_LINE=$(awk -v start="$START_LINE" 'NR > start && /^    public function/ {print NR-1; exit}' "$CONTROLLER_FILE")
    if [ -z "$END_LINE" ]; then
        # Se não encontrou próximo método, procurar fechamento da classe
        END_LINE=$(awk -v start="$START_LINE" 'NR > start && /^}$/ {print NR-1; exit}' "$CONTROLLER_FILE")
    fi
    if [ -n "$END_LINE" ]; then
        sudo sed -i "${START_LINE},${END_LINE}d" "$CONTROLLER_FILE"
    fi
    echo "✅ Método anterior removido"
fi

# 3. Adicionar import do CaregiverReview se não existir
if ! grep -q "use App\\Models\\CaregiverReview;" "$CONTROLLER_FILE"; then
    echo "📝 Adicionando import do CaregiverReview..."
    # Adicionar após os outros imports de Models
    if grep -q "use App\\Models\\" "$CONTROLLER_FILE"; then
        LAST_MODEL_LINE=$(grep -n "use App\\Models\\" "$CONTROLLER_FILE" | tail -1 | cut -d: -f1)
        sudo sed -i "${LAST_MODEL_LINE}a use App\\Models\\CaregiverReview;" "$CONTROLLER_FILE"
    else
        # Adicionar após o namespace
        NAMESPACE_LINE=$(grep -n "^namespace" "$CONTROLLER_FILE" | cut -d: -f1)
        sudo sed -i "${NAMESPACE_LINE}a use App\\Models\\CaregiverReview;" "$CONTROLLER_FILE"
    fi
    echo "✅ Import adicionado"
else
    echo "✅ Import do CaregiverReview já existe"
fi
echo ""

# 4. Encontrar onde adicionar o método (antes do último })
echo "📍 Localizando posição para adicionar método..."
LAST_PUBLIC_FUNCTION=$(grep -n "^    public function" "$CONTROLLER_FILE" | tail -1 | cut -d: -f1)
if [ -z "$LAST_PUBLIC_FUNCTION" ]; then
    echo "❌ Não foi possível encontrar onde adicionar o método"
    exit 1
fi

# Encontrar o fechamento do último método
METHOD_END=$(awk -v start="$LAST_PUBLIC_FUNCTION" 'NR > start && /^    }$/ {print NR; exit}' "$CONTROLLER_FILE")
if [ -z "$METHOD_END" ]; then
    METHOD_END=$((LAST_PUBLIC_FUNCTION + 50))
fi

echo "📍 Método será adicionado após a linha $METHOD_END"
echo ""

# 5. Criar método completo
TEMP_METHOD="/tmp/createClientReview_method.php"
cat > "$TEMP_METHOD" << 'METHOD_EOF'
    /**
     * Criar avaliação de um cliente
     */
    public function createClientReview(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            // Validar dados
            $validated = $request->validate([
                "rating" => "required|integer|min:1|max:5",
                "comment" => "required|string|min:10|max:500",
            ]);
            
            // Buscar cliente
            $client = User::find($id);
            if (!$client) {
                return response()->json([
                    "success" => false,
                    "message" => "Cliente não encontrado",
                ], 404);
            }
            
            // Verificar se o usuário e o cliente estão no mesmo grupo
            $userGroups = $user->groups()->pluck("groups.id")->toArray();
            $clientGroups = $client->groups()->pluck("groups.id")->toArray();
            $commonGroups = array_intersect($userGroups, $clientGroups);
            
            if (empty($commonGroups)) {
                return response()->json([
                    "success" => false,
                    "message" => "Você não tem permissão para avaliar este cliente",
                ], 403);
            }
            
            $groupId = $commonGroups[0]; // Usar o primeiro grupo em comum
            
            // Verificar se já existe uma avaliação deste cuidador para este cliente
            $existingReview = CaregiverReview::where("caregiver_id", $user->id)
                ->where("author_id", $client->id)
                ->where("group_id", $groupId)
                ->first();
            
            if ($existingReview) {
                // Atualizar avaliação existente
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
            
            // Criar nova avaliação
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
METHOD_EOF

# 6. Adicionar método ao arquivo
echo "📝 Adicionando método ao controller..."
TEMP_CONTROLLER="/tmp/CaregiverController_new.php"
head -n "$METHOD_END" "$CONTROLLER_FILE" > "$TEMP_CONTROLLER"
echo "" >> "$TEMP_CONTROLLER"
cat "$TEMP_METHOD" >> "$TEMP_CONTROLLER"
tail -n +$((METHOD_END + 1)) "$CONTROLLER_FILE" >> "$TEMP_CONTROLLER"

# 7. Verificar sintaxe antes de substituir
echo "🔍 Verificando sintaxe PHP..."
if php -l "$TEMP_CONTROLLER" > /dev/null 2>&1; then
    sudo cp "$TEMP_CONTROLLER" "$CONTROLLER_FILE"
    sudo chown www-data:www-data "$CONTROLLER_FILE"
    rm -f "$TEMP_METHOD" "$TEMP_CONTROLLER"
    echo "✅ Método adicionado com sucesso"
else
    echo "❌ Erro de sintaxe no arquivo gerado:"
    php -l "$TEMP_CONTROLLER"
    rm -f "$TEMP_METHOD" "$TEMP_CONTROLLER"
    exit 1
fi
echo ""

# 8. Verificar se o método foi adicionado
if grep -q "public function createClientReview" "$CONTROLLER_FILE"; then
    METHOD_LINE=$(grep -n "public function createClientReview" "$CONTROLLER_FILE" | cut -d: -f1)
    echo "✅ Método createClientReview encontrado na linha $METHOD_LINE"
else
    echo "❌ Método não foi adicionado corretamente"
    exit 1
fi
echo ""

# 9. Limpar cache
echo "🧹 Limpando cache do Laravel..."
php artisan route:clear > /dev/null 2>&1
php artisan config:clear > /dev/null 2>&1
php artisan cache:clear > /dev/null 2>&1
echo "✅ Cache limpo"
echo ""

echo "✅ Concluído com sucesso!"
echo ""
echo "📋 Resumo:"
echo "   - Backup: $BACKUP_FILE"
echo "   - Método createClientReview adicionado"
echo "   - Sintaxe verificada e válida"
echo "   - Cache limpo"
echo ""
echo "🎯 Agora teste novamente a avaliação no app!"

