#!/bin/bash

echo "🔧 Corrigindo método createClientReview no CaregiverController..."
echo ""

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

# 1. Fazer backup
echo "📦 Criando backup..."
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# 2. Verificar se o arquivo existe
if [ ! -f "$CONTROLLER_FILE" ]; then
    echo "❌ Arquivo não encontrado: $CONTROLLER_FILE"
    exit 1
fi

# 3. Verificar se o método já existe
if grep -q "public function createClientReview" "$CONTROLLER_FILE"; then
    echo "⚠️  Método createClientReview já existe. Removendo versão anterior..."
    # Remover método existente (da linha com "public function createClientReview" até a próxima "public function" ou "}")
    sudo sed -i '/public function createClientReview/,/^    public function\|^}$/d' "$CONTROLLER_FILE"
    echo "✅ Método anterior removido"
fi

# 4. Adicionar import do CaregiverReview se não existir
if ! grep -q "use App\\Models\\CaregiverReview;" "$CONTROLLER_FILE"; then
    echo "📝 Adicionando import do CaregiverReview..."
    # Adicionar após os outros imports de Models
    if grep -q "use App\\Models\\" "$CONTROLLER_FILE"; then
        sudo sed -i '/use App\\Models\\/a use App\\Models\\CaregiverReview;' "$CONTROLLER_FILE"
    else
        # Se não houver imports de Models, adicionar após os imports de Controllers
        if grep -q "use App\\Http\\Controllers" "$CONTROLLER_FILE"; then
            sudo sed -i '/use App\\Http\\Controllers/a use App\\Models\\CaregiverReview;' "$CONTROLLER_FILE"
        else
            # Adicionar após o namespace
            sudo sed -i '/^namespace/a use App\\Models\\CaregiverReview;' "$CONTROLLER_FILE"
        fi
    fi
    echo "✅ Import adicionado"
else
    echo "✅ Import do CaregiverReview já existe"
fi
echo ""

# 5. Encontrar onde adicionar o método (antes do último })
echo "📍 Localizando posição para adicionar método..."
LAST_PUBLIC_FUNCTION=$(grep -n "^    public function" "$CONTROLLER_FILE" | tail -1 | cut -d: -f1)
if [ -z "$LAST_PUBLIC_FUNCTION" ]; then
    echo "❌ Não foi possível encontrar onde adicionar o método"
    exit 1
fi

echo "📍 Método será adicionado após a linha $LAST_PUBLIC_FUNCTION"
echo ""

# 6. Criar arquivo temporário com o método
echo "📝 Criando método createClientReview..."
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
            return response()->json([
                "success" => false,
                "message" => "Erro ao criar avaliação: " . $e->getMessage(),
            ], 500);
        }
    }
METHOD_EOF

# 7. Adicionar método ao arquivo (antes do último })
echo "📝 Adicionando método ao controller..."
# Encontrar o último método público e adicionar o novo método após ele
LAST_PUBLIC_FUNC=$(grep -n "^    public function" "$CONTROLLER_FILE" | tail -1 | cut -d: -f1)
if [ -z "$LAST_PUBLIC_FUNC" ]; then
    echo "❌ Não foi possível encontrar métodos públicos no controller"
    rm -f "$TEMP_METHOD"
    exit 1
fi

# Encontrar o fechamento do último método (próximo } com 4 espaços de indentação)
METHOD_END=$(awk -v start="$LAST_PUBLIC_FUNC" 'NR > start && /^    }$/ {print NR; exit}' "$CONTROLLER_FILE")
if [ -z "$METHOD_END" ]; then
    # Se não encontrou, procurar por qualquer } após o último método
    METHOD_END=$(awk -v start="$LAST_PUBLIC_FUNC" 'NR > start && /^    }/ {print NR; exit}' "$CONTROLLER_FILE")
fi

# Se ainda não encontrou, usar uma linha após o último método público + 50 linhas (método grande)
if [ -z "$METHOD_END" ]; then
    METHOD_END=$((LAST_PUBLIC_FUNC + 50))
fi

# Criar novo arquivo com o método inserido
TEMP_CONTROLLER="/tmp/CaregiverController_new.php"
head -n "$METHOD_END" "$CONTROLLER_FILE" > "$TEMP_CONTROLLER"
echo "" >> "$TEMP_CONTROLLER"
cat "$TEMP_METHOD" >> "$TEMP_CONTROLLER"
tail -n +$((METHOD_END + 1)) "$CONTROLLER_FILE" >> "$TEMP_CONTROLLER"

# Verificar sintaxe antes de substituir
if php -l "$TEMP_CONTROLLER" > /dev/null 2>&1; then
    sudo cp "$TEMP_CONTROLLER" "$CONTROLLER_FILE"
    sudo chown www-data:www-data "$CONTROLLER_FILE"
    rm -f "$TEMP_METHOD" "$TEMP_CONTROLLER"
    echo "✅ Método adicionado"
else
    echo "❌ Erro de sintaxe no arquivo gerado"
    php -l "$TEMP_CONTROLLER"
    rm -f "$TEMP_METHOD" "$TEMP_CONTROLLER"
    exit 1
fi
echo ""

# 8. Verificar se o método foi adicionado corretamente
if grep -q "public function createClientReview" "$CONTROLLER_FILE"; then
    METHOD_LINE=$(grep -n "public function createClientReview" "$CONTROLLER_FILE" | cut -d: -f1)
    echo "✅ Método createClientReview adicionado na linha $METHOD_LINE"
else
    echo "❌ Método não foi adicionado corretamente"
    exit 1
fi
echo ""

# 9. Verificar método duplicado
DUPLICATE_COUNT=$(grep -c "public function createClientReview" "$CONTROLLER_FILE")
if [ "$DUPLICATE_COUNT" -gt 1 ]; then
    echo "⚠️  ATENÇÃO: Método duplicado detectado ($DUPLICATE_COUNT vezes)"
    echo "📋 Linhas com createClientReview:"
    grep -n "public function createClientReview" "$CONTROLLER_FILE"
else
    echo "✅ Nenhum método duplicado"
fi
echo ""

# 10. Ajustar permissões (já feito acima, mas garantindo)
sudo chown www-data:www-data "$CONTROLLER_FILE"
echo "✅ Permissões ajustadas"
echo ""

# 11. Limpar cache
echo "🧹 Limpando cache..."
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
echo ""

