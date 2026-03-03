#!/bin/bash
# Script para corrigir permissão de médicos avaliarem pacientes
# Execute NO SERVIDOR (192.168.0.20)

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

echo "🔧 Corrigindo permissão de médicos avaliarem pacientes..."
echo ""

# Fazer backup
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"
echo ""

# Verificar se o método existe
if ! grep -q "public function createClientReview" "$CONTROLLER_FILE"; then
    echo "❌ Método createClientReview não encontrado!"
    echo "   Execute primeiro o script para adicionar o método."
    exit 1
fi

# Encontrar o método createClientReview
START_LINE=$(grep -n "public function createClientReview" "$CONTROLLER_FILE" | cut -d: -f1)
echo "📍 Método encontrado na linha $START_LINE"
echo ""

# Criar versão corrigida do método com suporte a médicos
TEMP_METHOD="/tmp/createClientReview_corrigido.txt"
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
            
            // Verificar se o usuário é médico
            $isDoctor = $user->profile === 'doctor';
            $groupId = null;
            
            if ($isDoctor) {
                // Para médicos: verificar se há consultas com o paciente
                $hasAppointments = DB::table('appointments')
                    ->where('doctor_id', $user->id)
                    ->whereNotNull('group_id')
                    ->whereIn('group_id', function($query) use ($id) {
                        $query->select('group_id')
                            ->from('group_members')
                            ->where('user_id', $id)
                            ->where('role', 'patient');
                    })
                    ->exists();
                
                if (!$hasAppointments) {
                    return response()->json([
                        "success" => false,
                        "message" => "Você não tem permissão para avaliar este cliente. É necessário ter consultas agendadas com este paciente.",
                    ], 403);
                }
                
                // Buscar o group_id da primeira consulta encontrada
                $appointment = DB::table('appointments')
                    ->where('doctor_id', $user->id)
                    ->whereNotNull('group_id')
                    ->whereIn('group_id', function($query) use ($id) {
                        $query->select('group_id')
                            ->from('group_members')
                            ->where('user_id', $id)
                            ->where('role', 'patient');
                    })
                    ->first();
                
                $groupId = $appointment->group_id ?? null;
            } else {
                // Para cuidadores: verificar se estão no mesmo grupo
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
            }
            
            if (!$groupId) {
                return response()->json([
                    "success" => false,
                    "message" => "Não foi possível determinar o grupo para a avaliação",
                ], 500);
            }
            
            // Verificar se já existe uma avaliação deste cuidador/médico para este cliente
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
EOF

# Encontrar onde o método termina (próximo método público ou fechamento da classe)
END_LINE=$(awk -v start="$START_LINE" 'NR > start && /^    public function/ {print NR-1; exit}' "$CONTROLLER_FILE")
if [ -z "$END_LINE" ]; then
    # Se não encontrou próximo método, procurar fechamento da classe
    END_LINE=$(awk -v start="$START_LINE" 'NR > start && /^}$/ {print NR-1; exit}' "$CONTROLLER_FILE")
fi

if [ -z "$END_LINE" ]; then
    echo "❌ Não foi possível encontrar o fim do método"
    exit 1
fi

echo "📍 Substituindo método (linhas $START_LINE até $END_LINE)"
echo ""

# Criar novo arquivo com método corrigido
TEMP_CONTROLLER="/tmp/CaregiverController_corrigido.php"
head -n $((START_LINE - 1)) "$CONTROLLER_FILE" > "$TEMP_CONTROLLER"
cat "$TEMP_METHOD" >> "$TEMP_CONTROLLER"
tail -n +$((END_LINE + 1)) "$CONTROLLER_FILE" >> "$TEMP_CONTROLLER"

# Verificar sintaxe
echo "🔍 Verificando sintaxe PHP..."
if php -l "$TEMP_CONTROLLER" > /dev/null 2>&1; then
    sudo cp "$TEMP_CONTROLLER" "$CONTROLLER_FILE"
    sudo chown www-data:www-data "$CONTROLLER_FILE"
    rm -f "$TEMP_METHOD" "$TEMP_CONTROLLER"
    echo "✅ Método corrigido com sucesso!"
    echo ""
    echo "🧹 Limpando cache..."
    php artisan route:clear > /dev/null 2>&1
    php artisan config:clear > /dev/null 2>&1
    php artisan cache:clear > /dev/null 2>&1
    echo "✅ Cache limpo"
    echo ""
    echo "🎯 Agora médicos podem avaliar pacientes que tiveram consultas com eles!"
else
    echo "❌ Erro de sintaxe:"
    php -l "$TEMP_CONTROLLER"
    echo ""
    echo "⚠️  Restaurando backup..."
    sudo cp "$BACKUP_FILE" "$CONTROLLER_FILE"
    rm -f "$TEMP_METHOD" "$TEMP_CONTROLLER"
    exit 1
fi

