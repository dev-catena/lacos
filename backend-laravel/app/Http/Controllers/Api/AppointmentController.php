<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentException;
use App\Models\GroupActivity;
use App\Services\AppointmentPaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $groupId = $request->query('group_id');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $user = Auth::user();

        // Não usar with('doctor') pois pode causar timeout quando médico está em users
        // Buscaremos os dados do médico manualmente depois
        // Carregar exceptions apenas se a tabela existir
        $withRelations = [];
        if (Schema::hasTable('appointment_exceptions')) {
            $withRelations[] = 'exceptions';
        }
        $query = Appointment::query();
        if (!empty($withRelations)) {
            $query->with($withRelations);
        }

        if ($groupId) {
            $query->where('group_id', $groupId);
        }

        // Se o usuário for médico, filtrar teleconsultas não pagas
        // Médicos só devem ver teleconsultas que já foram pagas
        if ($user && $user->profile === 'doctor') {
            $query->where(function($q) {
                $q->where('is_teleconsultation', false) // Mostrar consultas normais
                  ->orWhere(function($q2) {
                      // Para teleconsultas, apenas mostrar se estiverem pagas
                      $q2->where('is_teleconsultation', true)
                         ->whereIn('payment_status', ['paid_held', 'paid', 'released']);
                  });
            });
        }

        // Usar scheduled_at com fallback para appointment_date quando scheduled_at for null
        if ($startDate) {
            $query->where(function($q) use ($startDate) {
                $q->where('scheduled_at', '>=', $startDate)
                  ->orWhere(function($q2) use ($startDate) {
                      $q2->whereNull('scheduled_at')
                         ->where('appointment_date', '>=', $startDate);
                  });
            });
        }

        if ($endDate) {
            $query->where(function($q) use ($endDate) {
                $q->where('scheduled_at', '<=', $endDate)
                  ->orWhere(function($q2) use ($endDate) {
                      $q2->whereNull('scheduled_at')
                         ->where('appointment_date', '<=', $endDate);
                  });
            });
        }

        // Ordenar usando COALESCE para usar scheduled_at quando disponível, senão appointment_date
        $appointments = $query->orderByRaw('COALESCE(scheduled_at, appointment_date) ASC')->get();
        
        // Adicionar dados do médico e paciente manualmente quando necessário (otimizado)
        $appointmentsArray = $appointments->map(function ($appointment) {
            $appointmentData = $appointment->toArray();
            
            // Compatibilidade: adicionar appointment_date se não existir (usando scheduled_at)
            if (!isset($appointmentData['appointment_date']) && isset($appointmentData['scheduled_at'])) {
                $appointmentData['appointment_date'] = $appointmentData['scheduled_at'];
            }
            
            // Buscar dados do médico usando o accessor (mais eficiente)
            if ($appointment->doctor_id) {
                try {
                    $doctorUser = $appointment->doctorUser;
                    if ($doctorUser) {
                        $appointmentData['doctor'] = $doctorUser;
                        $appointmentData['doctorUser'] = $doctorUser; // Para compatibilidade
                    }
                } catch (\Exception $e) {
                    // Ignorar erro ao buscar médico (não crítico)
                    \Log::warning('Erro ao buscar dados do médico no appointment: ' . $e->getMessage());
                }
            }
            
            // Buscar nome do paciente do grupo (accompanied_name ou membro com role='patient')
            if ($appointment->group_id && !isset($appointmentData['patient_name'])) {
                try {
                    $group = DB::table('groups')->where('id', $appointment->group_id)->first();
                    if ($group) {
                        // Primeiro tentar usar accompanied_name do grupo
                        if (isset($group->accompanied_name) && $group->accompanied_name) {
                            $appointmentData['patient_name'] = $group->accompanied_name;
                        } else {
                            // Se não tiver accompanied_name, buscar membro com role='patient' ou 'priority_contact'
                            $patientMember = DB::table('group_members')
                                ->where('group_id', $appointment->group_id)
                                ->whereIn('role', ['patient', 'priority_contact'])
                                ->join('users', 'group_members.user_id', '=', 'users.id')
                                ->select('users.name')
                                ->orderByRaw("CASE WHEN role = 'patient' THEN 1 ELSE 2 END") // Priorizar 'patient' sobre 'priority_contact'
                                ->first();
                            
                            if ($patientMember && isset($patientMember->name) && $patientMember->name) {
                                $appointmentData['patient_name'] = $patientMember->name;
                            }
                        }
                    }
                } catch (\Exception $e) {
                    // Log do erro para debug
                    \Log::warning('Erro ao buscar nome do paciente no appointment: ' . $e->getMessage(), [
                        'appointment_id' => $appointment->id,
                        'group_id' => $appointment->group_id,
                        'trace' => $e->getTraceAsString()
                    ]);
                }
            }
            
            return $appointmentData;
        });
        
        return response()->json($appointmentsArray);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'group_id' => 'required|exists:groups,id',
            'type' => 'required|in:common,medical,fisioterapia,exames',
            'title' => 'required|string|max:200',
            'description' => 'nullable|string',
            'appointment_date' => 'required|date',
            'scheduled_at' => 'nullable|date',
            'doctor_id' => [
                'nullable',
                function ($attribute, $value, $fail) {
                    if ($value === null) {
                        return;
                    }
                    // Verificar se existe na tabela doctors
                    $existsInDoctors = DB::table('doctors')->where('id', $value)->exists();
                    // Verificar se existe na tabela users com profile='doctor'
                    $existsInUsers = DB::table('users')->where('id', $value)->where('profile', 'doctor')->exists();
                    
                    if (!$existsInDoctors && !$existsInUsers) {
                        $fail('The selected doctor id is invalid.');
                    }
                },
            ],
            'medical_specialty_id' => 'nullable|exists:medical_specialties,id',
            'is_teleconsultation' => 'nullable|boolean',
            'location' => 'nullable|string|max:500',
            'notes' => 'nullable|string',
            'recurrence_type' => 'nullable|in:none,daily,weekdays,custom',
            'recurrence_days' => 'nullable|string',
            'recurrence_start' => 'nullable|date',
            'recurrence_end' => 'nullable|date',
        ]);

        // Se scheduled_at não foi fornecido, usar appointment_date
        if (!isset($validated['scheduled_at'])) {
            $validated['scheduled_at'] = $validated['appointment_date'];
        }

        // Garantir que recurrence_type sempre tenha um valor (padrão: 'none')
        if (!isset($validated['recurrence_type']) || empty($validated['recurrence_type'])) {
            $validated['recurrence_type'] = 'none';
        }
        
        // Remover campos de recorrência se não foram fornecidos (exceto recurrence_type que já tem valor padrão)
        if (!isset($validated['recurrence_days']) || empty($validated['recurrence_days'])) {
            unset($validated['recurrence_days']);
        }
        if (!isset($validated['recurrence_start']) || empty($validated['recurrence_start'])) {
            unset($validated['recurrence_start']);
        }
        if (!isset($validated['recurrence_end']) || empty($validated['recurrence_end'])) {
            unset($validated['recurrence_end']);
        }

        // Adicionar created_by_user_id com o ID do usuário autenticado
        $user = Auth::user();
        if ($user) {
            $validated['created_by_user_id'] = $user->id;
        }

        // Se for teleconsulta, definir payment_status como 'pending'
        if (isset($validated['is_teleconsultation']) && $validated['is_teleconsultation']) {
            $validated['payment_status'] = 'pending';
            // Definir valor padrão se não foi fornecido
            if (!isset($validated['amount'])) {
                // Buscar valor do médico
                $doctorId = $validated['doctor_id'] ?? null;
                $consultationPrice = null;
                
                if ($doctorId) {
                    $doctor = DB::table('users')
                        ->where('id', $doctorId)
                        ->where('profile', 'doctor')
                        ->first();
                    if ($doctor && isset($doctor->consultation_price)) {
                        $consultationPrice = $doctor->consultation_price;
                    } else {
                        $doctorFromTable = DB::table('doctors')->where('id', $doctorId)->first();
                        if ($doctorFromTable && isset($doctorFromTable->consultation_price)) {
                            $consultationPrice = $doctorFromTable->consultation_price;
                        }
                    }
                }
                
                // Se não encontrou valor, usar padrão
                if (!$consultationPrice) {
                    $consultationPrice = 100.00;
                }
                
                // Calcular valor total: consultation_price + 20% (taxa da plataforma)
                // O valor total é o que o paciente paga
                $validated['amount'] = round($consultationPrice * 1.20, 2);
            }
        }

        $appointment = Appointment::create($validated);
        // Não carregar relacionamento doctor aqui pois pode causar timeout
        // O relacionamento doctor só funciona para tabela doctors, não para users

        // Registrar atividade (em background para não causar timeout)
        try {
            $user = Auth::user();
            if ($user) {
                // Usar dispatch em background para não bloquear a resposta
                \Log::info('AppointmentController.store - Registrando atividade:', [
                    'appointment_id' => $appointment->id,
                    'appointment_title' => $appointment->title,
                    'group_id' => $appointment->group_id,
                    'user_id' => $user->id,
                ]);

                // Tentar criar atividade, mas não bloquear se falhar
                try {
                    $activity = GroupActivity::logAppointmentCreated(
                        $appointment->group_id,
                        $user->id,
                        $user->name,
                        $appointment->title,
                        $appointment->scheduled_at ?? $appointment->appointment_date,
                        $appointment->type,
                        $appointment->id
                    );
                    \Log::info('AppointmentController.store - Atividade criada:', ['activity_id' => $activity->id ?? 'N/A']);
                } catch (\Exception $activityError) {
                    \Log::warning('Erro ao criar atividade (não crítico): ' . $activityError->getMessage());
                }
            }
        } catch (\Exception $e) {
            \Log::warning('Erro ao registrar atividade de compromisso: ' . $e->getMessage());
            // Não bloquear a resposta por erro de atividade
        }

        // Enviar notificações aos membros do grupo
        try {
            $notificationService = app(\App\Services\NotificationService::class);
            $group = $appointment->group;
            
            if ($group) {
                // Buscar membros do grupo (exceto quem criou)
                $members = $group->members()->where('user_id', '!=', $user->id)->get();
                
                \Log::info('AppointmentController.store - Enviando notificações', [
                    'members_count' => $members->count(),
                    'group_id' => $appointment->group_id,
                ]);
                
                $appointmentDate = \Carbon\Carbon::parse($appointment->scheduled_at ?? $appointment->appointment_date);
                $typeLabels = [
                    'common' => 'compromisso',
                    'medical' => 'consulta médica',
                    'fisioterapia' => 'sessão de fisioterapia',
                    'exames' => 'exame',
                ];
                $typeLabel = $typeLabels[$appointment->type] ?? 'compromisso';
                
                foreach ($members as $member) {
                    $memberUser = \App\Models\User::find($member->user_id);
                    
                    if (!$memberUser) {
                        \Log::warning('AppointmentController.store - Usuário não encontrado', [
                            'user_id' => $member->user_id,
                        ]);
                        continue;
                    }
                    
                    // Verificar preferências de notificação
                    $shouldNotify = $notificationService->hasNotificationPreference($memberUser, 'appointment_reminders');
                    
                    \Log::info('AppointmentController.store - Verificando preferência de notificação', [
                        'user_id' => $memberUser->id,
                        'shouldNotify' => $shouldNotify,
                    ]);
                    
                    if (!$shouldNotify) {
                        \Log::info('AppointmentController.store - Usuário desabilitou notificações de consultas', [
                            'user_id' => $memberUser->id,
                        ]);
                        continue;
                    }
                    
                    $title = 'Novo Compromisso Agendado';
                    $message = "{$user->name} agendou um {$typeLabel}: {$appointment->title} para " . $appointmentDate->format('d/m/Y \à\s H:i');
                    if ($appointment->location) {
                        $message .= " em {$appointment->location}";
                    }
                    
                    \Log::info('AppointmentController.store - Enviando notificação', [
                        'user_id' => $memberUser->id,
                        'title' => $title,
                        'message' => $message,
                    ]);
                    
                    $notification = $notificationService->sendNotification(
                        $memberUser,
                        'appointment',
                        $title,
                        $message,
                        [
                            'appointment_id' => $appointment->id,
                            'group_id' => $appointment->group_id,
                            'appointment_title' => $appointment->title,
                            'appointment_date' => $appointmentDate->toIso8601String(),
                            'appointment_type' => $appointment->type,
                            'action_type' => 'appointment_created',
                        ],
                        false, // Não enviar WhatsApp
                        $appointment->group_id
                    );
                    
                    if ($notification) {
                        \Log::info('AppointmentController.store - Notificação criada com sucesso', [
                            'notification_id' => $notification->id,
                            'user_id' => $memberUser->id,
                        ]);
                    } else {
                        \Log::warning('AppointmentController.store - Falha ao criar notificação', [
                            'user_id' => $memberUser->id,
                        ]);
                    }
                }
            }
        } catch (\Exception $e) {
            \Log::error('AppointmentController.store - Erro ao enviar notificações de compromisso', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }

        // Retornar resposta rapidamente sem carregar relacionamentos pesados
        return response()->json($appointment, 201);
    }

    public function show($id)
    {
        // Carregar relacionamentos apenas se as tabelas existirem
        $withRelations = [];
        if (Schema::hasTable('appointment_exceptions')) {
            $withRelations[] = 'exceptions';
        }
        // Não usar with('doctor') pois pode causar timeout quando médico está em users
        
        $query = Appointment::query();
        if (!empty($withRelations)) {
            $query->with($withRelations);
        }
        $appointment = $query->findOrFail($id);
        return response()->json($appointment);
    }

    public function update(Request $request, $id)
    {
        $appointment = Appointment::findOrFail($id);

        $validated = $request->validate([
            'type' => 'sometimes|in:common,medical,fisioterapia,exames',
            'title' => 'sometimes|string|max:200',
            'description' => 'nullable|string',
            'appointment_date' => 'sometimes|date',
            'scheduled_at' => 'nullable|date',
            'doctor_id' => [
                'nullable',
                function ($attribute, $value, $fail) {
                    if ($value === null) {
                        return;
                    }
                    // Verificar se existe na tabela doctors
                    $existsInDoctors = DB::table('doctors')->where('id', $value)->exists();
                    // Verificar se existe na tabela users com profile='doctor'
                    $existsInUsers = DB::table('users')->where('id', $value)->where('profile', 'doctor')->exists();
                    
                    if (!$existsInDoctors && !$existsInUsers) {
                        $fail('The selected doctor id is invalid.');
                    }
                },
            ],
            'medical_specialty_id' => 'nullable|exists:medical_specialties,id',
            'is_teleconsultation' => 'nullable|boolean',
            'location' => 'nullable|string|max:500',
            'notes' => 'nullable|string',
            'recurrence_type' => 'nullable|in:none,daily,weekdays,custom',
            'recurrence_days' => 'nullable|string',
            'recurrence_start' => 'nullable|date',
            'recurrence_end' => 'nullable|date',
        ]);

        // Garantir que recurrence_type sempre tenha um valor (padrão: 'none')
        if (!isset($validated['recurrence_type']) || empty($validated['recurrence_type'])) {
            $validated['recurrence_type'] = 'none';
        }
        
        // Remover campos de recorrência se não foram fornecidos (exceto recurrence_type que já tem valor padrão)
        if (!isset($validated['recurrence_days']) || empty($validated['recurrence_days'])) {
            unset($validated['recurrence_days']);
        }
        if (!isset($validated['recurrence_start']) || empty($validated['recurrence_start'])) {
            unset($validated['recurrence_start']);
        }
        if (!isset($validated['recurrence_end']) || empty($validated['recurrence_end'])) {
            unset($validated['recurrence_end']);
        }

        $appointment->update($validated);
        $appointment->load('doctor');

        return response()->json($appointment);
    }

    public function destroy(Request $request, $id)
    {
        $appointment = Appointment::findOrFail($id);
        
        // Verificar se é uma exclusão de data específica (para recorrências)
        $exceptionDate = $request->query('exception_date');
        
        if ($exceptionDate && ($appointment->recurrence_type && $appointment->recurrence_type !== 'none')) {
            // É uma recorrência e queremos excluir apenas uma data específica
            // Criar uma exceção ao invés de excluir o compromisso todo
            $appointment->exceptions()->create([
                'exception_date' => $exceptionDate,
            ]);
            
            return response()->json([
                'message' => 'Data específica excluída da recorrência com sucesso',
                'exception_created' => true,
            ]);
        }
        
        // Excluir o compromisso completo
        $appointment->delete();

        return response()->json(['message' => 'Appointment deleted successfully']);
    }
    
    /**
     * Confirmar consulta realizada
     * POST /api/appointments/{id}/confirm
     */
    public function confirm(Request $request, $id)
    {
        try {
            $appointment = Appointment::findOrFail($id);
            $user = Auth::user();
            
            // Verificar permissão
            if ($appointment->group_id) {
                $userGroups = $user->groups()->pluck('groups.id')->toArray();
                if (!in_array($appointment->group_id, $userGroups)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Você não tem permissão para confirmar esta consulta'
                    ], 403);
                }
            }
            
            // Verificar se pagamento está em hold
            if ($appointment->payment_status !== 'paid_held') {
                return response()->json([
                    'success' => false,
                    'message' => 'Esta consulta não tem pagamento em hold para liberar'
                ], 400);
            }
            
            $paymentService = app(AppointmentPaymentService::class);
            $result = $paymentService->confirmAndRelease($appointment, 'patient');
            
            if (!$result['success']) {
                return response()->json($result, 400);
            }
            
            return response()->json([
                'success' => true,
                'appointment_id' => $appointment->id,
                'status' => $appointment->fresh()->status,
                'payment_status' => $appointment->fresh()->payment_status,
                'transfers' => $result['transfers'] ?? [],
                'doctor_amount' => $result['doctor_amount'] ?? null,
                'platform_amount' => $result['platform_amount'] ?? null,
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erro ao confirmar consulta', [
                'appointment_id' => $id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erro ao confirmar consulta: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Cancelar consulta
     * POST /api/appointments/{id}/cancel
     */
    public function cancel(Request $request, $id)
    {
        try {
            $appointment = Appointment::findOrFail($id);
            $user = Auth::user();
            
            $validated = $request->validate([
                'cancelled_by' => 'required|in:doctor,patient',
                'reason' => 'nullable|string|max:500',
            ]);
            
            // Verificar permissão baseado em quem está cancelando
            $hasPermission = false;
            
            if ($validated['cancelled_by'] === 'doctor') {
                // Médico: verificar se é o médico da consulta
                if ($appointment->doctor_id && $appointment->doctor_id == $user->id) {
                    $hasPermission = true;
                }
            } else {
                // Cuidador/Paciente: verificar se pertence ao grupo
                if ($appointment->group_id) {
                    // Verificar via relacionamento groups
                    $userGroups = $user->groups()->pluck('groups.id')->toArray();
                    if (in_array($appointment->group_id, $userGroups)) {
                        $hasPermission = true;
                    } else {
                        // Verificar via group_members diretamente (fallback)
                        $isMember = DB::table('group_members')
                            ->where('group_id', $appointment->group_id)
                            ->where('user_id', $user->id)
                            ->where('is_active', true)
                            ->exists();
                        if ($isMember) {
                            $hasPermission = true;
                        }
                    }
                }
            }
            
            if (!$hasPermission) {
                return response()->json([
                    'success' => false,
                    'message' => 'Você não tem permissão para cancelar esta consulta'
                ], 403);
            }
            
            // Verificar se a consulta já está cancelada
            if ($appointment->status === 'cancelled') {
                return response()->json([
                    'success' => false,
                    'message' => 'Esta consulta já foi cancelada'
                ], 400);
            }
            
            // Verificar se a consulta já foi completada
            if ($appointment->status === 'completed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Não é possível cancelar uma consulta que já foi completada'
                ], 400);
            }
            
            // Validar regras de cancelamento baseado em quem está cancelando
            $appointmentDate = \Carbon\Carbon::parse($appointment->appointment_date ?? $appointment->scheduled_at);
            $now = \Carbon\Carbon::now();
            
            if ($validated['cancelled_by'] === 'doctor') {
                // Médico pode cancelar até a hora da consulta
                if ($now > $appointmentDate) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Não é possível cancelar uma consulta após o horário agendado'
                    ], 400);
                }
            } else {
                // Cuidador/amigo deve cancelar pelo menos 1 hora antes
                $oneHourBefore = $appointmentDate->copy()->subHour();
                if ($now > $oneHourBefore) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Não é possível cancelar. O cancelamento deve ser feito com pelo menos 1 hora de antecedência.'
                    ], 400);
                }
            }
            
            // Se tem pagamento em hold e foi cancelado pelo menos 1 hora antes, reembolsar
            $oneHourBefore = $appointmentDate->copy()->subHour();
            $canRefund = $now <= $oneHourBefore;
            
            if ($appointment->payment_status === 'paid_held' && $canRefund) {
                // Reembolsar se cancelado 1 hora antes
                $paymentService = app(AppointmentPaymentService::class);
                $result = $paymentService->cancelAndRefund($appointment, $validated['cancelled_by']);
                
                if (!$result['success']) {
                    return response()->json($result, 400);
                }
                
                $appointment->refresh();
            } elseif ($appointment->payment_status === 'paid_held' && !$canRefund) {
                // Se tem pagamento mas não pode reembolsar (menos de 1 hora), apenas cancelar sem reembolso
                $appointment->update([
                    'status' => 'cancelled',
                    'cancelled_by' => $validated['cancelled_by'],
                    // Manter payment_status como 'paid_held' pois não houve reembolso
                ]);
            } else {
                // Apenas cancelar sem reembolso (sem pagamento ou pagamento já processado)
                $appointment->update([
                    'status' => 'cancelled',
                    'cancelled_by' => $validated['cancelled_by'],
                ]);
            }
            
            // Criar atividade de grupo para aparecer na seção de últimas atualizações
            try {
                // Carregar o relacionamento group explicitamente
                $appointment->load('group');
                $group = $appointment->group;
                
                if ($group) {
                    $doctorName = $user->name;
                    $appointmentTitle = $appointment->title ?? 'Consulta';
                    $appointmentType = $appointment->type ?? 'medical';
                    
                    Log::info('AppointmentController.cancel - Criando atividade de cancelamento', [
                        'appointment_id' => $appointment->id,
                        'group_id' => $appointment->group_id,
                        'user_id' => $user->id,
                        'user_name' => $doctorName,
                        'appointment_title' => $appointmentTitle,
                        'cancelled_by' => $validated['cancelled_by'],
                    ]);
                    
                    $activity = GroupActivity::logAppointmentCancelled(
                        $appointment->group_id,
                        $user->id,
                        $doctorName,
                        $appointmentTitle,
                        $appointmentDate->toIso8601String(),
                        $appointmentType,
                        $appointment->id,
                        $validated['cancelled_by']
                    );
                    
                    if ($activity) {
                        Log::info('AppointmentController.cancel - Atividade de cancelamento criada com sucesso', [
                            'activity_id' => $activity->id,
                            'group_id' => $activity->group_id,
                            'action_type' => $activity->action_type,
                        ]);
                    } else {
                        Log::warning('AppointmentController.cancel - Atividade de cancelamento retornou null');
                    }
                } else {
                    Log::warning('AppointmentController.cancel - Grupo não encontrado para o appointment', [
                        'appointment_id' => $appointment->id,
                        'group_id' => $appointment->group_id,
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Erro ao criar atividade de cancelamento', [
                    'appointment_id' => $appointment->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
            
            // Enviar notificações para cuidador e paciente
            try {
                $notificationService = app(\App\Services\NotificationService::class);
                $group = $appointment->group;
                
                if ($group) {
                    // Buscar membros do grupo (cuidador e paciente)
                    $members = $group->members()->get();
                    
                    foreach ($members as $member) {
                        $memberUser = $member->user ?? \App\Models\User::find($member->user_id);
                        
                        if (!$memberUser) continue;
                        
                        // Verificar preferências de notificação
                        $preferences = $memberUser->notificationPreferences;
                        if ($preferences && !$preferences->appointment_cancellation) {
                            continue; // Usuário desabilitou notificações de cancelamento
                        }
                        
                        // Buscar nome do paciente
                        $patient = $members->firstWhere('role', 'patient');
                        $patientName = $patient && $patient->user ? $patient->user->name : 'Paciente';
                        
                        $title = 'Consulta Cancelada';
                        if ($validated['cancelled_by'] === 'doctor') {
                            $message = "A consulta agendada para " . $appointmentDate->format('d/m/Y \à\s H:i');
                            $message .= " com {$patientName} foi cancelada pelo médico";
                        } else {
                            $message = "A consulta agendada para " . $appointmentDate->format('d/m/Y \à\s H:i');
                            $message .= " com {$patientName} foi cancelada pelo cuidador";
                        }
                        if ($validated['reason']) {
                            $message .= ".\nMotivo: " . $validated['reason'];
                        } else {
                            $message .= ".";
                        }
                        
                        // Adicionar informação de reembolso se aplicável
                        $appointment->refresh();
                        if ($appointment->payment_status === 'refunded' && $appointment->refund_id) {
                            $message .= "\n\nO valor pago foi reembolsado.";
                        }
                        
                        $notificationService->sendNotification(
                            $memberUser,
                            'appointment_cancelled',
                            $title,
                            $message,
                            [
                                'appointment_id' => $appointment->id,
                                'group_id' => $appointment->group_id,
                                'patient_id' => $patient && $patient->user ? $patient->user->id : null,
                                'patient_name' => $patientName,
                                'appointment_date' => $appointmentDate->toIso8601String(),
                                'cancelled_by' => $validated['cancelled_by'],
                                'reason' => $validated['reason'] ?? null,
                            ],
                            false, // Não enviar WhatsApp
                            $appointment->group_id
                        );
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Erro ao enviar notificações de cancelamento', [
                    'appointment_id' => $appointment->id,
                    'error' => $e->getMessage(),
                ]);
            }
            
            return response()->json([
                'success' => true,
                'appointment_id' => $appointment->id,
                'status' => $appointment->fresh()->status,
                'payment_status' => $appointment->fresh()->payment_status ?? null,
                'message' => 'Consulta cancelada com sucesso',
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erro ao cancelar consulta', [
                'appointment_id' => $id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erro ao cancelar consulta: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Processar pagamento de uma consulta
     * POST /api/appointments/{id}/payment
     */
    public function processPayment(Request $request, $id)
    {
        try {
            $appointment = Appointment::findOrFail($id);
            $user = Auth::user();
            
            // Verificar permissão
            if ($appointment->group_id) {
                $userGroups = $user->groups()->pluck('groups.id')->toArray();
                if (!in_array($appointment->group_id, $userGroups)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Você não tem permissão para pagar esta consulta'
                    ], 403);
                }
            }
            
            $validated = $request->validate([
                'payment_method' => 'required|string|in:credit_card,debit_card,pix',
                'card_token' => 'required_if:payment_method,credit_card,debit_card|string',
                'installments' => 'nullable|integer|min:1|max:12',
            ]);
            
            $paymentService = app(AppointmentPaymentService::class);
            $result = $paymentService->processPayment($appointment, $validated);
            
            if (!$result['success']) {
                return response()->json($result, 400);
            }
            
            return response()->json($result);
            
        } catch (\Exception $e) {
            Log::error('Erro ao processar pagamento', [
                'appointment_id' => $id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erro ao processar pagamento: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Verificar status do pagamento
     * GET /api/appointments/{id}/payment-status
     */
    public function paymentStatus($id)
    {
        try {
            $appointment = Appointment::findOrFail($id);
            $user = Auth::user();
            
            // Verificar permissão
            if ($appointment->group_id) {
                $userGroups = $user->groups()->pluck('groups.id')->toArray();
                if (!in_array($appointment->group_id, $userGroups)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Você não tem permissão para ver este status'
                    ], 403);
                }
            }
            
            $scheduledAt = \Carbon\Carbon::parse($appointment->scheduled_at);
            $autoReleaseAt = $scheduledAt->copy()->addHours(6);
            $timeUntilAutoRelease = now()->diffInMinutes($autoReleaseAt, false);
            
            return response()->json([
                'success' => true,
                'appointment_id' => $appointment->id,
                'payment_status' => $appointment->payment_status ?? 'pending',
                'amount' => $appointment->amount,
                'payment_id' => $appointment->payment_id,
                'hold_id' => $appointment->payment_hold_id,
                'held_at' => $appointment->held_at,
                'scheduled_at' => $appointment->scheduled_at,
                'time_until_auto_release' => $timeUntilAutoRelease > 0 ? $timeUntilAutoRelease . ' minutos' : 'Já liberado',
                'auto_release_at' => $autoReleaseAt->toDateTimeString(),
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erro ao verificar status de pagamento', [
                'appointment_id' => $id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erro ao verificar status: ' . $e->getMessage()
            ], 500);
        }
    }
}

