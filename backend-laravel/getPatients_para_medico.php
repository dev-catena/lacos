<?php
/**
 * MÉTODO getPatients para médicos
 * 
 * Retorna pacientes que já agendaram pelo menos uma consulta com o médico
 * Dados retornados: nome completo, idade, sexo, data da última consulta
 */

    /**
     * Listar pacientes do médico (usuários que agendaram consultas)
     * 
     * GET /api/caregivers/clients (ou /api/doctors/patients)
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPatients()
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

            if (!$doctor) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuário não é um médico'
                ], 403);
            }

            // Buscar todos os appointments do médico
            $appointments = DB::table('appointments')
                ->where('doctor_id', $doctor->id)
                ->whereNotNull('group_id')
                ->select('group_id', 'appointment_date')
                ->orderBy('appointment_date', 'desc')
                ->get();

            if ($appointments->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            // Agrupar por group_id e pegar a última consulta de cada grupo
            $groupLastAppointment = [];
            foreach ($appointments as $appointment) {
                $groupId = $appointment->group_id;
                if (!isset($groupLastAppointment[$groupId])) {
                    $groupLastAppointment[$groupId] = $appointment->appointment_date;
                }
            }

            $groupIds = array_keys($groupLastAppointment);

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

        } catch (\Exception $e) {
            Log::error('Erro em getPatients: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao buscar pacientes',
                'errors' => []
            ], 500);
        }
    }


