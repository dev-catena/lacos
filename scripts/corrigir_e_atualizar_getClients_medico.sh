#!/bin/bash

echo "🔧 Corrigindo imports e atualizando getClients para médicos..."
echo ""

cd /var/www/lacos-backend || exit 1

CONTROLLER_FILE="app/Http/Controllers/Api/CaregiverController.php"
BACKUP_FILE="${CONTROLLER_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

# Fazer backup
sudo cp "$CONTROLLER_FILE" "$BACKUP_FILE"
echo "✅ Backup: $BACKUP_FILE"
echo ""

# 1. Corrigir imports (linhas 12 e 13)
echo "📝 Corrigindo imports..."
sudo sed -i '12s/.*/use Illuminate\\Support\\Facades\\Auth;/' "$CONTROLLER_FILE"
sudo sed -i '13s/.*/use Illuminate\\Support\\Facades\\Log;/' "$CONTROLLER_FILE"
echo "✅ Imports corrigidos"
echo ""

# 2. Encontrar o método getClients e substituir
echo "📝 Atualizando método getClients..."

# Encontrar início e fim do método
START_LINE=$(grep -n "public function getClients" "$CONTROLLER_FILE" | cut -d: -f1)
if [ -z "$START_LINE" ]; then
    echo "❌ Método getClients não encontrado!"
    exit 1
fi

# Encontrar o final do método (próximo método ou fechamento da classe)
END_LINE=$(sed -n "$START_LINE,\$p" "$CONTROLLER_FILE" | grep -n "^    }$" | head -1 | cut -d: -f1)
END_LINE=$((START_LINE + END_LINE - 1))

echo "   Método encontrado nas linhas $START_LINE-$END_LINE"
echo ""

# Criar novo método
cat > /tmp/new_getClients.txt << 'METHOD_EOF'
    public function getClients()
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
            $doctor = DB::table('doctors')
                ->where('user_id', $user->id)
                ->first();

            if ($doctor) {
                // LÓGICA PARA MÉDICOS: Buscar pacientes que agendaram consultas
                $appointments = DB::table('appointments')
                    ->where('doctor_id', $doctor->id)
                    ->whereNotNull('group_id')
                    ->select('group_id', DB::raw('MAX(appointment_date) as last_appointment'))
                    ->groupBy('group_id')
                    ->get();

                if ($appointments->isEmpty()) {
                    return response()->json([
                        'success' => true,
                        'data' => []
                    ]);
                }

                $groupIds = $appointments->pluck('group_id')->toArray();
                $groupLastAppointment = $appointments->pluck('last_appointment', 'group_id')->toArray();

                // Buscar pacientes (membros com role 'patient') desses grupos
                $patients = DB::table('group_members')
                    ->join('users', 'group_members.user_id', '=', 'users.id')
                    ->whereIn('group_members.group_id', $groupIds)
                    ->where('group_members.role', 'patient')
                    ->select(
                        'users.id',
                        'users.name',
                        'users.birth_date',
                        'users.gender',
                        'group_members.group_id'
                    )
                    ->distinct()
                    ->get()
                    ->map(function ($patient) use ($groupLastAppointment) {
                        // Calcular idade
                        $age = null;
                        if ($patient->birth_date) {
                            $birthDate = new \DateTime($patient->birth_date);
                            $today = new \DateTime();
                            $age = $today->diff($birthDate)->y;
                        }

                        // Data da última consulta do grupo
                        $lastAppointment = $groupLastAppointment[$patient->group_id] ?? null;

                        return [
                            'id' => $patient->id,
                            'name' => $patient->name,
                            'age' => $age,
                            'gender' => $patient->gender === 'male' ? 'Masculino' : ($patient->gender === 'female' ? 'Feminino' : ($patient->gender ?? 'Não informado')),
                            'last_appointment_date' => $lastAppointment,
                            'group_id' => $patient->group_id,
                        ];
                    })
                    ->sortByDesc('last_appointment_date')
                    ->values();

                return response()->json([
                    'success' => true,
                    'data' => $patients
                ]);
            }

            // LÓGICA PARA CUIDADORES: Buscar admins dos grupos
            $groupIds = DB::table('group_members')
                ->where('user_id', $user->id)
                ->pluck('group_id')
                ->toArray();

            if (empty($groupIds)) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            $clients = DB::table('group_members')
                ->join('users', 'group_members.user_id', '=', 'users.id')
                ->join('groups', 'group_members.group_id', '=', 'groups.id')
                ->whereIn('group_members.group_id', $groupIds)
                ->where('group_members.role', 'admin')
                ->where('group_members.user_id', '!=', $user->id)
                ->select(
                    'users.id',
                    'users.name',
                    'users.email',
                    'users.phone',
                    'users.city',
                    'users.neighborhood',
                    'users.photo as photo_url',
                    'groups.name as group_name',
                    'groups.id as group_id'
                )
                ->distinct()
                ->get()
                ->map(function ($client) {
                    $rating = DB::table('reviews')
                        ->where('reviewed_user_id', $client->id)
                        ->avg('rating');
                    
                    $reviewsCount = DB::table('reviews')
                        ->where('reviewed_user_id', $client->id)
                        ->count();

                    return [
                        'id' => $client->id,
                        'name' => $client->name,
                        'email' => $client->email,
                        'phone' => $client->phone,
                        'city' => $client->city,
                        'neighborhood' => $client->neighborhood,
                        'photo_url' => $client->photo_url,
                        'photo' => $client->photo_url,
                        'group_name' => $client->group_name,
                        'group_id' => $client->group_id,
                        'rating' => $rating ? round($rating, 1) : 0,
                        'reviews_count' => $reviewsCount,
                    ];
                })
                ->values();

            return response()->json([
                'success' => true,
                'data' => $clients
            ]);

        } catch (\Exception $e) {
            Log::error('Erro em getClients: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar clientes',
                'errors' => []
            ], 500);
        }
    }
METHOD_EOF

# Substituir método
sudo sed -i "${START_LINE},${END_LINE}d" "$CONTROLLER_FILE"
sudo sed -i "${START_LINE}i\\$(cat /tmp/new_getClients.txt)" "$CONTROLLER_FILE"
rm /tmp/new_getClients.txt

echo "✅ Método atualizado"
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

echo "✅ Correção e atualização concluídas!"
echo ""
echo "📋 O método agora:"
echo "   - Corrige os imports Auth e Log"
echo "   - Detecta se o usuário é médico"
echo "   - Para médicos: retorna pacientes baseado em appointments"
echo "   - Para cuidadores: mantém a lógica original (admins dos grupos)"


