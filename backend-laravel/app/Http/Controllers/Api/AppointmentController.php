<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentException;
use App\Models\DoctorReview;
use App\Models\GroupActivity;
use App\Services\AppointmentPaymentService;
use App\Services\AppointmentReminderService;
use App\Services\Agora\AgoraTokenService;
use App\Services\GroupPatientNameResolver;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class AppointmentController extends Controller
{
    /**
     * Médico designado: doctor_id pode ser users.id ou doctors.id (resolvido via doctorUser.platform_user_id).
     */
    private function actingUserIsAssignedDoctor(Appointment $appointment, $user): bool
    {
        if (!$appointment->doctor_id) {
            return false;
        }
        if ((int) $appointment->doctor_id === (int) $user->id) {
            return true;
        }
        try {
            $doc = $appointment->doctorUser;
            if ($doc && isset($doc->platform_user_id) && $doc->platform_user_id !== null
                && (int) $doc->platform_user_id === (int) $user->id) {
                return true;
            }
        } catch (\Throwable $e) {
            Log::warning('actingUserIsAssignedDoctor: '.$e->getMessage());
        }

        return false;
    }

    /** ID numérico da consulta (ignora sufixo de instância recorrente, ex.: 89_2025-05-26). */
    private function resolveAppointmentRouteId($id): int
    {
        $base = explode('_', (string) $id)[0];

        return (int) $base;
    }

    private function findAppointmentForVideo($id): Appointment
    {
        return Appointment::findOrFail($this->resolveAppointmentRouteId($id));
    }

    private function userIsAppointmentGroupMember(Appointment $appointment, $user): bool
    {
        if (!$appointment->group_id) {
            return false;
        }

        $userGroups = $user->groups()->pluck('groups.id')->toArray();
        if (in_array($appointment->group_id, $userGroups, true)) {
            return true;
        }

        return DB::table('group_members')
            ->where('group_id', $appointment->group_id)
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->exists();
    }

    /**
     * Valida janela de horário da teleconsulta (15 min antes até 40 min depois).
     *
     * @return array{0: bool, 1: ?\Illuminate\Http\JsonResponse}
     */
    private function validateTeleconsultVideoWindow(Appointment $appointment): array
    {
        if (!$appointment->is_teleconsultation) {
            return [false, response()->json([
                'success' => false,
                'message' => 'Este compromisso não é uma teleconsulta',
            ], 400)];
        }

        $scheduledAt = $appointment->scheduled_at ?? $appointment->appointment_date;
        if (!$scheduledAt) {
            return [false, response()->json([
                'success' => false,
                'message' => 'Horário da consulta não definido',
            ], 400)];
        }

        $now = now();
        $windowStart = $scheduledAt->copy()->subMinutes(15);
        $windowEnd = $scheduledAt->copy()->addMinutes(40);

        if ($now->lt($windowStart)) {
            return [false, response()->json([
                'success' => false,
                'message' => 'A entrada na videoconferência é permitida a partir de 15 minutos antes do horário',
            ], 400)];
        }

        if ($now->gt($windowEnd)) {
            return [false, response()->json([
                'success' => false,
                'message' => 'O horário para entrar na videoconferência já passou (40 minutos após o início)',
            ], 400)];
        }

        return [true, null];
    }

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

        // Não mostrar consultas canceladas
        $query->where('status', '!=', 'cancelled');

        // Teleconsultas agendadas aparecem para o médico assim que marcadas (ex.: pending); o app indica
        // pagamento pendente e bloqueia a videochamada até paid_held/paid/released. Ocultar só reembolsadas.
        if ($user && $user->profile === 'doctor') {
            $query->where(function($q) {
                $q->where('is_teleconsultation', false)
                  ->orWhere(function($q2) {
                      $q2->where('is_teleconsultation', true)
                         ->where(function($q3) {
                             $q3->whereNull('payment_status')
                                ->orWhere('payment_status', '<>', 'refunded');
                         });
                  });
            });
        }

        // Intervalo: início/fim do dia para não cortar consultas no último dia do range (comparação com date-only).
        if ($startDate) {
            $startDateTime = Carbon::parse($startDate)->startOfDay()->toDateTimeString();
            $query->where(function($q) use ($startDateTime) {
                $q->where('scheduled_at', '>=', $startDateTime)
                  ->orWhere(function($q2) use ($startDateTime) {
                      $q2->whereNull('scheduled_at')
                         ->where('appointment_date', '>=', $startDateTime);
                  });
            });
        }

        if ($endDate) {
            $endDateTime = Carbon::parse($endDate)->endOfDay()->toDateTimeString();
            $query->where(function($q) use ($endDateTime) {
                $q->where('scheduled_at', '<=', $endDateTime)
                  ->orWhere(function($q2) use ($endDateTime) {
                      $q2->whereNull('scheduled_at')
                         ->where('appointment_date', '<=', $endDateTime);
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
                    $platformUser = Appointment::resolveDoctorUserForNotification((int) $appointment->doctor_id);
                    $appointmentData['assigned_platform_user_id'] = $platformUser ? (int) $platformUser->id : null;
                } catch (\Throwable $e) {
                    $appointmentData['assigned_platform_user_id'] = null;
                }
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
            
            // Nome do paciente (membro do grupo — nunca o nome do grupo)
            if ($appointment->group_id) {
                try {
                    $resolvedPatient = GroupPatientNameResolver::resolve((int) $appointment->group_id);
                    if ($resolvedPatient) {
                        $appointmentData['patient_name'] = $resolvedPatient;
                    }
                } catch (\Exception $e) {
                    \Log::warning('Erro ao buscar nome do paciente no appointment: '.$e->getMessage(), [
                        'appointment_id' => $appointment->id,
                        'group_id' => $appointment->group_id,
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
            'reminder_times' => 'nullable',
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

        if (Schema::hasColumn('appointments', 'reminder_times')) {
            if (array_key_exists('reminder_times', $validated)) {
                $validated['reminder_times'] = AppointmentReminderService::normalizeReminderMinutes($validated['reminder_times']);
            } else {
                $validated['reminder_times'] = AppointmentReminderService::DEFAULT_REMINDER_MINUTES;
            }
        } else {
            unset($validated['reminder_times']);
        }

        // Adicionar created_by_user_id com o ID do usuário autenticado
        $user = Auth::user();
        if ($user) {
            $validated['created_by_user_id'] = $user->id;
        }

        // O médico designado (doctor_id) não precisa ser membro do grupo; o compromisso pertence ao grupo do paciente.

        // Se for teleconsulta, definir payment_status como 'pending' e reservar horário por 10 minutos
        if (isset($validated['is_teleconsultation']) && $validated['is_teleconsultation']) {
            $validated['payment_status'] = 'pending';
            // Reservar horário por 10 minutos para dar tempo de pagamento
            $validated['reserved_until'] = now()->addMinutes(10);
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

        if (!empty($validated['is_teleconsultation']) && !empty($validated['doctor_id'])) {
            $slot = Carbon::parse($validated['scheduled_at'] ?? $validated['appointment_date']);
            $conflict = Appointment::findConflictingTeleconsultationAppointment(
                (int) $validated['doctor_id'],
                $slot
            );
            if ($conflict) {
                return response()->json([
                    'message' => 'Este horário já está reservado para este médico. Escolha outro horário.',
                    'errors' => [
                        'scheduled_at' => ['Este horário já está reservado para este médico.'],
                    ],
                ], 422);
            }
        }

        $appointment = Appointment::create($validated);
        $doctorActivityLabel = Appointment::doctorLineForActivityDescription($appointment);
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
                        $appointment->id,
                        $doctorActivityLabel
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
            
            if ($group && $user) {
                // Membros ativos (is_active null = legado, tratar como ativo)
                $members = $group->members()
                    ->where('user_id', '!=', $user->id)
                    ->where(function ($q) {
                        $q->where('is_active', true)->orWhereNull('is_active');
                    })
                    ->get();
                
                \Log::info('AppointmentController.store - Enviando notificações', [
                    'members_count' => $members->count(),
                    'group_id' => $appointment->group_id,
                ]);
                
                // Usar timezone do Brasil (GMT-3) para formatar a data
                $timezone = 'America/Sao_Paulo';
                $appointmentDate = \Carbon\Carbon::parse($appointment->scheduled_at ?? $appointment->appointment_date)
                    ->setTimezone($timezone);
                $typeLabels = [
                    'common' => 'compromisso',
                    'medical' => 'consulta médica',
                    'fisioterapia' => 'sessão de fisioterapia',
                    'exames' => 'exame',
                ];
                $typeLabel = $typeLabels[$appointment->type] ?? 'compromisso';
                $useUma = in_array($appointment->type, ['medical', 'fisioterapia'], true);
                $article = $useUma ? 'uma' : 'um';
                $appointmentSubjectLabel = $doctorActivityLabel ?? $appointment->title;
                $reminderService = app(AppointmentReminderService::class);
                $detailsMessage = $reminderService->buildDetailsMessage($appointment, $appointmentDate, $timezone);
                
                foreach ($members as $member) {
                    $memberUser = \App\Models\User::find($member->user_id);
                    
                    if (!$memberUser) {
                        \Log::warning('AppointmentController.store - Usuário não encontrado', [
                            'user_id' => $member->user_id,
                        ]);
                        continue;
                    }
                    
                    // Preferência: lembretes de horário OU atualizações do grupo (não só appointment_reminders)
                    $shouldNotify = $notificationService->shouldNotifyNewGroupAppointment($memberUser);
                    \Log::info('AppointmentController.store - Verificando preferência de notificação', [
                        'user_id' => $memberUser->id,
                        'shouldNotify' => $shouldNotify,
                    ]);
                    if (!$shouldNotify) {
                        \Log::info('AppointmentController.store - Usuário desabilitou avisos de novo agendamento (lembretes e atualizações do grupo)', [
                            'user_id' => $memberUser->id,
                        ]);
                        continue;
                    }
                    
                    $title = 'Novo Compromisso Agendado';
                    $message = "{$user->name} agendou {$article} {$typeLabel}.\n\n{$detailsMessage}";
                    
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
        $data = $appointment->toArray();
        if ($appointment->doctor_id) {
            try {
                $platformUser = Appointment::resolveDoctorUserForNotification((int) $appointment->doctor_id);
                $data['assigned_platform_user_id'] = $platformUser ? (int) $platformUser->id : null;
            } catch (\Throwable $e) {
                $data['assigned_platform_user_id'] = null;
            }
        }

        // Para teleconsultas realizadas: indicar se o usuário já avaliou o médico
        if (Schema::hasTable('doctor_reviews') && Auth::check()) {
            $hasReview = \App\Models\DoctorReview::where('appointment_id', $appointment->id)
                ->where('author_id', Auth::id())
                ->exists();
            $data['has_user_review'] = $hasReview;
        }

        if ($appointment->group_id) {
            try {
                $resolvedPatient = GroupPatientNameResolver::resolve((int) $appointment->group_id);
                if ($resolvedPatient) {
                    $data['patient_name'] = $resolvedPatient;
                }
            } catch (\Throwable $e) {
                \Log::warning('Erro ao buscar nome do paciente no show appointment: '.$e->getMessage());
            }
        }

        return response()->json($data);
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

        // Só altera recorrência quando o cliente envia explicitamente esses campos
        if (array_key_exists('recurrence_type', $validated)) {
            if (empty($validated['recurrence_type'])) {
                $validated['recurrence_type'] = 'none';
            }
            if ($validated['recurrence_type'] === 'none') {
                $validated['recurrence_days'] = null;
                $validated['recurrence_start'] = null;
                $validated['recurrence_end'] = null;
            } else {
                if (!isset($validated['recurrence_days']) || $validated['recurrence_days'] === '') {
                    unset($validated['recurrence_days']);
                }
                if (!isset($validated['recurrence_start']) || empty($validated['recurrence_start'])) {
                    unset($validated['recurrence_start']);
                }
                if (!isset($validated['recurrence_end']) || empty($validated['recurrence_end'])) {
                    unset($validated['recurrence_end']);
                }
            }
        } else {
            unset(
                $validated['recurrence_type'],
                $validated['recurrence_days'],
                $validated['recurrence_start'],
                $validated['recurrence_end']
            );
        }

        $mergedDoctorId = isset($validated['doctor_id']) ? (int) $validated['doctor_id'] : (int) $appointment->doctor_id;
        $mergedScheduled = isset($validated['scheduled_at'])
            ? Carbon::parse($validated['scheduled_at'])
            : ($appointment->scheduled_at ?? $appointment->appointment_date);
        $mergedIsTele = array_key_exists('is_teleconsultation', $validated)
            ? (bool) $validated['is_teleconsultation']
            : (bool) $appointment->is_teleconsultation;

        if ($mergedIsTele && $mergedDoctorId && $mergedScheduled) {
            $conflict = Appointment::findConflictingTeleconsultationAppointment(
                $mergedDoctorId,
                $mergedScheduled,
                (int) $appointment->id
            );
            if ($conflict) {
                return response()->json([
                    'message' => 'Este horário já está reservado para este médico. Escolha outro horário.',
                    'errors' => [
                        'scheduled_at' => ['Este horário já está reservado para este médico.'],
                    ],
                ], 422);
            }
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
     * Body opcional: rating (1-5), comment (string) - avaliação do médico
     */
    public function confirm(Request $request, $id)
    {
        try {
            $appointment = Appointment::findOrFail($id);
            $user = Auth::user();

            $validated = $request->validate([
                'rating' => 'nullable|integer|min:1|max:5',
                'comment' => 'nullable|string|max:500',
            ]);

            // Verificar permissão (paciente ou cuidador participante do grupo)
            if ($appointment->group_id) {
                $userGroups = $user->groups()->pluck('groups.id')->toArray();
                $isMember = in_array($appointment->group_id, $userGroups);
                if (!$isMember) {
                    $isMember = DB::table('group_members')
                        ->where('group_id', $appointment->group_id)
                        ->where('user_id', $user->id)
                        ->where('is_active', true)
                        ->exists();
                }
                if (!$isMember) {
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

            // Avaliação opcional do médico
            $reviewCreated = false;
            if (!empty($validated['rating']) && $appointment->doctor_id && Schema::hasTable('doctor_reviews')) {
                try {
                    $existing = DoctorReview::where('appointment_id', $appointment->id)
                        ->where('author_id', $user->id)
                        ->first();
                    if (!$existing) {
                        DoctorReview::create([
                            'appointment_id' => $appointment->id,
                            'doctor_id' => $appointment->doctor_id,
                            'author_id' => $user->id,
                            'rating' => $validated['rating'],
                            'comment' => $validated['comment'] ?? null,
                        ]);
                        $reviewCreated = true;
                    }
                } catch (\Exception $e) {
                    Log::warning('Erro ao criar avaliação do médico', [
                        'appointment_id' => $appointment->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'appointment_id' => $appointment->id,
                'status' => $appointment->fresh()->status,
                'payment_status' => $appointment->fresh()->payment_status,
                'transfers' => $result['transfers'] ?? [],
                'doctor_amount' => $result['doctor_amount'] ?? null,
                'platform_amount' => $result['platform_amount'] ?? null,
                'review_created' => $reviewCreated,
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
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
     * Avaliar médico após teleconsulta realizada
     * POST /api/appointments/{id}/reviews
     */
    public function createReview(Request $request, $id)
    {
        try {
            $appointment = Appointment::findOrFail($id);
            $user = Auth::user();

            $validated = $request->validate([
                'rating' => 'required|integer|min:1|max:5',
                'comment' => 'nullable|string|max:500',
            ]);

            // Verificar permissão (paciente ou cuidador participante do grupo)
            if ($appointment->group_id) {
                $userGroups = $user->groups()->pluck('groups.id')->toArray();
                $isMember = in_array($appointment->group_id, $userGroups);
                if (!$isMember) {
                    $isMember = DB::table('group_members')
                        ->where('group_id', $appointment->group_id)
                        ->where('user_id', $user->id)
                        ->where('is_active', true)
                        ->exists();
                }
                if (!$isMember) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Você não tem permissão para avaliar esta consulta'
                    ], 403);
                }
            }

            // Apenas teleconsultas realizadas podem ser avaliadas
            if (!$appointment->is_teleconsultation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Apenas teleconsultas podem ser avaliadas'
                ], 400);
            }

            // Exigir pagamento liberado: não basta status "completed" com pagamento ainda pendente
            if ($appointment->payment_status !== 'released') {
                return response()->json([
                    'success' => false,
                    'message' => 'Só é possível avaliar o médico após a consulta ser concluída e o pagamento liberado.',
                ], 400);
            }

            if (!$appointment->doctor_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Esta consulta não possui médico para avaliar'
                ], 400);
            }

            if (!Schema::hasTable('doctor_reviews')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Avaliações não disponíveis'
                ], 500);
            }

            $existing = DoctorReview::where('appointment_id', $appointment->id)
                ->where('author_id', $user->id)
                ->first();

            if ($existing) {
                $existing->update([
                    'rating' => $validated['rating'],
                    'comment' => $validated['comment'] ?? null,
                ]);
                $review = $existing;
            } else {
                $review = DoctorReview::create([
                    'appointment_id' => $appointment->id,
                    'doctor_id' => $appointment->doctor_id,
                    'author_id' => $user->id,
                    'rating' => $validated['rating'],
                    'comment' => $validated['comment'] ?? null,
                ]);
            }

            return response()->json([
                'success' => true,
                'review' => $review,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('Erro ao criar avaliação do médico', [
                'appointment_id' => $id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erro ao avaliar: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Token RTC Agora para entrar na videoconferência.
     * GET /api/appointments/{id}/agora-token
     */
    public function agoraToken(Request $request, $id, AgoraTokenService $agoraTokenService)
    {
        try {
            $appointment = $this->findAppointmentForVideo($id);
            $user = Auth::user();

            [$ok, $errorResponse] = $this->validateTeleconsultVideoWindow($appointment);
            if (!$ok) {
                return $errorResponse;
            }

            $isDoctor = $this->actingUserIsAssignedDoctor($appointment, $user);
            $isPatient = $this->userIsAppointmentGroupMember($appointment, $user);

            if (!$isDoctor && !$isPatient) {
                return response()->json([
                    'success' => false,
                    'message' => 'Você não tem permissão para entrar nesta videoconferência',
                ], 403);
            }

            if ($isDoctor) {
                $ps = $appointment->payment_status;
                if (!in_array($ps, ['paid_held', 'paid', 'released'], true)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Pagamento pendente. A videoconferência só pode ser iniciada após a confirmação do pagamento.',
                    ], 403);
                }
            }

            $channelName = $agoraTokenService->getChannelName((int) $appointment->id);
            $uid = $agoraTokenService->toAgoraUid((int) $user->id);
            $token = $agoraTokenService->buildRtcToken($channelName, $uid);

            if (empty(config('services.agora.app_certificate'))) {
                Log::warning('AGORA_APP_CERTIFICATE não configurado — token vazio (modo teste Agora)');
            }

            return response()->json([
                'success' => true,
                'token' => $token,
                'channel_name' => $channelName,
                'uid' => $uid,
                'app_id' => config('services.agora.app_id'),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Consulta não encontrada',
            ], 404);
        } catch (\Exception $e) {
            Log::error('Erro ao gerar token Agora', [
                'appointment_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao gerar token de vídeo: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Registrar entrada na videoconferência
     * POST /api/appointments/{id}/video-join
     * Body: { "role": "doctor" | "patient" }
     * Janela permitida: 15 min antes até 40 min depois do horário agendado.
     * Usado para rastrear no-show (médico não entra → reembolso; paciente não entra → libera ao médico).
     */
    public function videoJoin(Request $request, $id)
    {
        try {
            $appointment = $this->findAppointmentForVideo($id);
            $user = Auth::user();

            $validated = $request->validate([
                'role' => 'required|in:doctor,patient',
            ]);

            [$ok, $errorResponse] = $this->validateTeleconsultVideoWindow($appointment);
            if (!$ok) {
                return $errorResponse;
            }

            $updated = false;

            if ($validated['role'] === 'doctor') {
                if (!$this->actingUserIsAssignedDoctor($appointment, $user)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Apenas o médico da consulta pode registrar entrada como médico',
                    ], 403);
                }
                $ps = $appointment->payment_status;
                if (!in_array($ps, ['paid_held', 'paid', 'released'], true)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Pagamento pendente. A videoconferência só pode ser iniciada após a confirmação do pagamento.',
                    ], 403);
                }
                if (!$appointment->doctor_joined_at) {
                    $appointment->update(['doctor_joined_at' => now()]);
                    $updated = true;
                }
            } else {
                if (!$this->userIsAppointmentGroupMember($appointment, $user)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Apenas participantes do grupo podem registrar entrada como paciente',
                    ], 403);
                }
                if (!$appointment->patient_joined_at) {
                    $appointment->update([
                        'patient_joined_at' => now(),
                        'patient_joined_by_user_id' => $user->id,
                    ]);
                    $updated = true;
                }
            }

            return response()->json([
                'success' => true,
                'joined' => $updated,
                'doctor_joined_at' => $appointment->fresh()->doctor_joined_at?->toIso8601String(),
                'patient_joined_at' => $appointment->fresh()->patient_joined_at?->toIso8601String(),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            Log::error('Erro ao registrar entrada na videoconferência', [
                'appointment_id' => $id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erro ao registrar entrada: ' . $e->getMessage(),
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
                if ($this->actingUserIsAssignedDoctor($appointment, $user)) {
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
            // Usar timezone do Brasil (GMT-3) para comparações e formatação
            $timezone = 'America/Sao_Paulo';
            $appointmentDate = \Carbon\Carbon::parse($appointment->appointment_date ?? $appointment->scheduled_at)
                ->setTimezone($timezone);
            $now = \Carbon\Carbon::now()->setTimezone($timezone);
            
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
                        // Garantir que a data está no timezone correto para formatação
                        $formattedDate = $appointmentDate->setTimezone('America/Sao_Paulo')->format('d/m/Y \à\s H:i');
                        if ($validated['cancelled_by'] === 'doctor') {
                            $message = "A consulta agendada para " . $formattedDate;
                            $message .= " com {$patientName} foi cancelada pelo médico";
                        } else {
                            $message = "A consulta agendada para " . $formattedDate;
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

