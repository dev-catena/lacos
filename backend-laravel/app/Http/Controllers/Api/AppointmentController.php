<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentException;
use App\Models\GroupActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $groupId = $request->query('group_id');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $query = Appointment::with(['doctor', 'exceptions']);

        if ($groupId) {
            $query->where('group_id', $groupId);
        }

        if ($startDate) {
            $query->where('scheduled_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('scheduled_at', '<=', $endDate);
        }

        $appointments = $query->orderBy('scheduled_at', 'asc')->get();
        
        // Adicionar dados do médico manualmente quando necessário
        $appointmentsArray = $appointments->map(function ($appointment) {
            $appointmentData = $appointment->toArray();
            
            // Compatibilidade: adicionar appointment_date se não existir (usando scheduled_at)
            if (!isset($appointmentData['appointment_date']) && isset($appointmentData['scheduled_at'])) {
                $appointmentData['appointment_date'] = $appointmentData['scheduled_at'];
            }
            
            // Se não tem doctor no relacionamento, buscar manualmente
            if ($appointment->doctor_id && !$appointment->doctor) {
                $doctorUser = $appointment->doctorUser;
                if ($doctorUser) {
                    $appointmentData['doctor'] = $doctorUser;
                    $appointmentData['doctorUser'] = $doctorUser; // Para compatibilidade
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

        $appointment = Appointment::create($validated);
        $appointment->load('doctor');

        // Registrar atividade
        try {
            $user = Auth::user();
            if ($user) {
                \Log::info('AppointmentController.store - Registrando atividade:', [
                    'appointment_id' => $appointment->id,
                    'appointment_title' => $appointment->title,
                    'group_id' => $appointment->group_id,
                    'user_id' => $user->id,
                ]);

                $activity = GroupActivity::logAppointmentCreated(
                    $appointment->group_id,
                    $user->id,
                    $user->name,
                    $appointment->title,
                    $appointment->scheduled_at ?? $appointment->appointment_date,
                    $appointment->type,
                    $appointment->id
                );

                \Log::info('AppointmentController.store - Atividade criada:', ['activity_id' => $activity->id]);
            }
        } catch (\Exception $e) {
            \Log::warning('Erro ao registrar atividade de compromisso: ' . $e->getMessage());
            \Log::warning('Stack trace atividade: ' . $e->getTraceAsString());
        }

        return response()->json($appointment);
    }

    public function show($id)
    {
        $appointment = Appointment::with(['doctor', 'exceptions'])->findOrFail($id);
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
            
            $paymentService = new \App\Services\AppointmentPaymentService();
            $result = $paymentService->releasePayment($appointment, 'patient');
            
            return response()->json([
                'success' => true,
                'appointment_id' => $appointment->id,
                'status' => $appointment->fresh()->status,
                'payment_status' => $appointment->fresh()->payment_status,
                'transfers' => $result['transfers'] ?? [],
                'is_mock' => $result['is_mock'] ?? false,
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
            
            // Verificar permissão
            if ($appointment->group_id) {
                $userGroups = $user->groups()->pluck('groups.id')->toArray();
                if (!in_array($appointment->group_id, $userGroups)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Você não tem permissão para cancelar esta consulta'
                    ], 403);
                }
            }
            
            $validated = $request->validate([
                'cancelled_by' => 'required|in:doctor,patient',
                'reason' => 'nullable|string|max:500',
            ]);
            
            // Se tem pagamento em hold, reembolsar
            if ($appointment->payment_status === 'paid_held') {
                $paymentService = new \App\Services\AppointmentPaymentService();
                $result = $paymentService->refundPayment($appointment, $validated['cancelled_by'], $validated['reason'] ?? null);
                
                return response()->json([
                    'success' => true,
                    'appointment_id' => $appointment->id,
                    'status' => $appointment->fresh()->status,
                    'payment_status' => $appointment->fresh()->payment_status,
                    'refund_id' => $result['refund_id'] ?? null,
                    'refund_amount' => $result['refund_amount'] ?? null,
                    'is_mock' => $result['is_mock'] ?? false,
                ]);
            } else {
                // Apenas cancelar sem reembolso
                $appointment->update([
                    'status' => 'cancelled',
                    'cancelled_by' => $validated['cancelled_by'],
                    'cancelled_at' => now(),
                ]);
                
                return response()->json([
                    'success' => true,
                    'appointment_id' => $appointment->id,
                    'status' => 'cancelled',
                    'message' => 'Consulta cancelada',
                ]);
            }
            
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

