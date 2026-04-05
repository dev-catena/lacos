<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentException;
use App\Models\GroupActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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
            $query->where('appointment_date', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('appointment_date', '<=', $endDate);
        }

        return response()->json($query->orderBy('appointment_date', 'asc')->get());
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
            'doctor_id' => 'nullable|exists:doctors,id',
            'medical_specialty_id' => 'nullable|exists:medical_specialties,id',
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
                    $appointment->appointment_date,
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
            'doctor_id' => 'nullable|exists:doctors,id',
            'medical_specialty_id' => 'nullable|exists:medical_specialties,id',
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
}

