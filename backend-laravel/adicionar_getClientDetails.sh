#!/bin/bash

echo "🔧 Adicionando método getClientDetails ao CaregiverController..."
echo ""

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

# Fazer backup
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup: $BACKUP_FILE"
echo ""

# Verificar se método já existe
if grep -q "public function getClientDetails" "$CONTROLLER_FILE"; then
    echo "✅ Método getClientDetails já existe!"
    exit 0
fi

# Encontrar onde adicionar (antes do último })
LAST_BRACE=$(grep -n "^}" "$CONTROLLER_FILE" | tail -1 | cut -d: -f1)
INSERT_LINE=$((LAST_BRACE - 1))

echo "📝 Adicionando método na linha $INSERT_LINE..."
echo ""

# Criar método completo
cat > /tmp/getClientDetails_method.txt << 'METHOD_EOF'

    /**
     * Obter detalhes de um cliente/paciente específico
     * 
     * GET /api/caregivers/clients/{id}
     */
    public function getClientDetails($id)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não autenticado'
                ], 401);
            }

            // Verificar se o usuário é médico
            $isDoctor = $user->profile === 'doctor';

            if ($isDoctor) {
                // Para médicos: buscar paciente que agendou consultas
                $patient = DB::table('users')
                    ->where('id', $id)
                    ->select(
                        'id',
                        'name',
                        'email',
                        'phone',
                        'birth_date',
                        'gender',
                        'city',
                        'neighborhood',
                        'photo'
                    )
                    ->first();

                if (!$patient) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Paciente não encontrado'
                    ], 404);
                }

                // Verificar se o paciente tem consultas com este médico
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
                        'success' => false,
                        'message' => 'Paciente não encontrado ou sem consultas com este médico'
                    ], 404);
                }

                // Buscar última consulta
                $lastAppointment = DB::table('appointments')
                    ->where('doctor_id', $user->id)
                    ->whereNotNull('group_id')
                    ->whereIn('group_id', function($query) use ($id) {
                        $query->select('group_id')
                            ->from('group_members')
                            ->where('user_id', $id)
                            ->where('role', 'patient');
                    })
                    ->orderBy('appointment_date', 'desc')
                    ->select('appointment_date', 'title', 'type')
                    ->first();

                // Calcular idade
                $age = null;
                if ($patient->birth_date) {
                    $birthDate = new \DateTime($patient->birth_date);
                    $today = new \DateTime();
                    $age = $today->diff($birthDate)->y;
                }

                $patientData = [
                    'id' => $patient->id,
                    'name' => $patient->name,
                    'email' => $patient->email,
                    'phone' => $patient->phone,
                    'age' => $age,
                    'gender' => $patient->gender === 'male' ? 'Masculino' : ($patient->gender === 'female' ? 'Feminino' : ($patient->gender ?? 'Não informado')),
                    'city' => $patient->city,
                    'neighborhood' => $patient->neighborhood,
                    'photo_url' => $patient->photo,
                    'photo' => $patient->photo,
                    'last_appointment_date' => $lastAppointment->appointment_date ?? null,
                    'last_appointment_title' => $lastAppointment->title ?? null,
                    'reviews' => [],
                ];

                return response()->json([
                    'success' => true,
                    'data' => $patientData
                ]);
            }

            // Para cuidadores: buscar admin do grupo
            $client = DB::table('users')
                ->join('group_members', 'users.id', '=', 'group_members.user_id')
                ->join('groups', 'group_members.group_id', '=', 'groups.id')
                ->where('users.id', $id)
                ->where('group_members.role', 'admin')
                ->whereIn('group_members.group_id', function($query) use ($user) {
                    $query->select('group_id')
                        ->from('group_members')
                        ->where('user_id', $user->id);
                })
                ->select(
                    'users.id',
                    'users.name',
                    'users.email',
                    'users.phone',
                    'users.city',
                    'users.neighborhood',
                    'users.photo',
                    'groups.name as group_name',
                    'groups.id as group_id'
                )
                ->first();

            if (!$client) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cliente não encontrado'
                ], 404);
            }

            // Buscar reviews
            $reviews = DB::table('reviews')
                ->where('reviewed_user_id', $id)
                ->select('id', 'rating', 'comment', 'created_at')
                ->orderBy('created_at', 'desc')
                ->get();

            $rating = DB::table('reviews')
                ->where('reviewed_user_id', $id)
                ->avg('rating');

            $clientData = [
                'id' => $client->id,
                'name' => $client->name,
                'email' => $client->email,
                'phone' => $client->phone,
                'city' => $client->city,
                'neighborhood' => $client->neighborhood,
                'photo_url' => $client->photo,
                'photo' => $client->photo,
                'group_name' => $client->group_name,
                'group_id' => $client->group_id,
                'rating' => $rating ? round($rating, 1) : 0,
                'reviews_count' => $reviews->count(),
                'reviews' => $reviews,
            ];

            return response()->json([
                'success' => true,
                'data' => $clientData
            ]);

        } catch (\Exception $e) {
            Log::error('Erro em getClientDetails: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
                'client_id' => $id,
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar detalhes do cliente',
                'errors' => []
            ], 500);
        }
    }
METHOD_EOF

# Inserir método
sudo sed -i "${INSERT_LINE}r /tmp/getClientDetails_method.txt" "$CONTROLLER_FILE"
rm /tmp/getClientDetails_method.txt

echo "✅ Método adicionado"
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

echo "✅ Método getClientDetails adicionado com sucesso!"


