<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PatientAlert;
use App\Models\MedicationLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class AlertController extends Controller
{
    /**
     * Listar alertas ativos de um grupo
     * 
     * GET /api/groups/{groupId}/alerts/active
     */
    public function getActiveAlerts($groupId)
    {
        try {
            // Verificar se usuário tem acesso ao grupo
            $group = Auth::user()->groups()->find($groupId);
            
            if (!$group) {
                return response()->json([
                    'message' => 'Grupo não encontrado ou você não tem acesso'
                ], 403);
            }

            // Buscar paciente do grupo usando query direta na tabela group_members
            $patient = \Illuminate\Support\Facades\DB::table('group_members')
                ->join('users', 'group_members.user_id', '=', 'users.id')
                ->where('group_members.group_id', $groupId)
                ->where('group_members.role', 'patient')
                ->where('users.is_active', 1)
                ->select('users.id', 'users.name')
                ->first();

            if (!$patient) {
                return response()->json([]);
            }

            // Buscar alertas ativos
            $alerts = PatientAlert::where('group_id', $groupId)
                ->where('patient_user_id', $patient->id)
                ->where('is_active', true)
                ->where(function($query) {
                    $query->whereNull('expires_at')
                        ->orWhere('expires_at', '>', Carbon::now());
                })
                ->orderBy('priority', 'desc')
                ->orderBy('time', 'asc')
                ->get()
                ->map(function ($alert) {
                    return [
                        'id' => $alert->id,
                        'group_id' => $alert->group_id,
                        'patient_user_id' => $alert->patient_user_id,
                        'type' => $alert->type,
                        'message' => $alert->message,
                        'details' => $alert->details,
                        
                        // Campos específicos por tipo
                        'medication_name' => $alert->medication_name,
                        'dosage' => $alert->dosage,
                        'appointment_type' => $alert->appointment_type,
                        'location' => $alert->location,
                        'vital_sign_type' => $alert->vital_sign_type,
                        'value' => $alert->value,
                        'normal_range' => $alert->normal_range,
                        
                        // Estado
                        'is_active' => $alert->is_active,
                        'priority' => $alert->priority,
                        'time' => $alert->time ? $alert->time->toIso8601String() : null,
                        'expires_at' => $alert->expires_at ? $alert->expires_at->toIso8601String() : null,
                        'created_at' => $alert->created_at->toIso8601String(),
                    ];
                });

            return response()->json($alerts);
            
        } catch (\Exception $e) {
            \Log::error('Erro ao buscar alertas: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Erro ao buscar alertas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Marcar medicamento como tomado
     * 
     * POST /api/alerts/{alertId}/taken
     */
    public function markMedicationTaken($alertId)
    {
        try {
            $alert = PatientAlert::findOrFail($alertId);
            
            // Verificar se é um alerta de medicamento
            if ($alert->type !== 'medication') {
                return response()->json([
                    'message' => 'Este alerta não é de medicamento'
                ], 400);
            }

            // Verificar se usuário tem acesso ao grupo
            $group = Auth::user()->groups()->find($alert->group_id);
            
            if (!$group) {
                return response()->json([
                    'message' => 'Você não tem acesso a este grupo'
                ], 403);
            }

            // Marcar alerta como inativo
            $alert->update([
                'is_active' => false,
                'taken_at' => Carbon::now(),
            ]);

            // Registrar no log de medicamentos
            if ($alert->medication_id) {
                MedicationLog::create([
                    'medication_id' => $alert->medication_id,
                    'user_id' => Auth::id(),
                    'taken_at' => Carbon::now(),
                    'status' => 'taken',
                    'notes' => 'Marcado via alerta',
                ]);
            }

            // TODO: Notificar cuidadores
            // event(new MedicationTaken($alert));

            return response()->json([
                'message' => 'Medicamento marcado como tomado',
                'alert_id' => $alert->id,
                'taken_at' => $alert->taken_at->toIso8601String(),
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Erro ao marcar medicamento: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Erro ao marcar medicamento',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Dispensar alerta
     * 
     * POST /api/alerts/{alertId}/dismiss
     */
    public function dismissAlert($alertId)
    {
        try {
            $alert = PatientAlert::findOrFail($alertId);
            
            // Verificar se usuário tem acesso ao grupo
            $group = Auth::user()->groups()->find($alert->group_id);
            
            if (!$group) {
                return response()->json([
                    'message' => 'Você não tem acesso a este grupo'
                ], 403);
            }

            // Marcar alerta como inativo
            $alert->update([
                'is_active' => false,
                'dismissed_at' => Carbon::now(),
            ]);

            return response()->json([
                'message' => 'Alerta dispensado',
                'alert_id' => $alert->id,
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Erro ao dispensar alerta: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Erro ao dispensar alerta',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Gerar alertas de medicamentos (cron job)
     * Rodar a cada minuto
     */
    public function generateMedicationAlerts()
    {
        try {
            // Buscar medicamentos ativos com schedule
            $medications = \App\Models\Medication::whereNotNull('schedule')
                ->with(['group.members' => function($query) {
                    $query->wherePivot('role', 'patient');
                }])
                ->get();

            $generatedCount = 0;

            foreach ($medications as $medication) {
                $patient = $medication->group->members->first();
                
                if (!$patient) continue;

                // Verificar se já existe alerta ativo para este medicamento
                $existingAlert = PatientAlert::where('medication_id', $medication->id)
                    ->where('is_active', true)
                    ->where('time', '>=', Carbon::now()->subHours(1))
                    ->exists();

                if ($existingAlert) continue;

                // Verificar se é hora de criar o alerta
                $schedule = json_decode($medication->schedule, true);
                $now = Carbon::now();
                
                // Lógica simples: verificar se está no horário
                // TODO: Implementar lógica mais sofisticada baseada no schedule
                
                foreach ($schedule['times'] ?? [] as $time) {
                    $alertTime = Carbon::createFromFormat('H:i', $time);
                    
                    // Se está dentro de 5 minutos do horário
                    if (abs($now->diffInMinutes($alertTime)) <= 5) {
                        PatientAlert::create([
                            'group_id' => $medication->group_id,
                            'patient_user_id' => $patient->id,
                            'medication_id' => $medication->id,
                            'type' => 'medication',
                            'message' => 'Hora de tomar seu medicamento!',
                            'medication_name' => $medication->name . ' ' . $medication->dosage,
                            'dosage' => $medication->dosage,
                            'priority' => 2,
                            'time' => $alertTime,
                            'expires_at' => $alertTime->copy()->addMinutes(30),
                            'is_active' => true,
                        ]);
                        
                        $generatedCount++;
                    }
                }
            }

            \Log::info('Alertas de medicamento gerados: ' . $generatedCount);
            
            return response()->json([
                'message' => 'Alertas gerados',
                'count' => $generatedCount
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Erro ao gerar alertas: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Erro ao gerar alertas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Limpar alertas expirados (cron job)
     * Rodar a cada hora
     */
    public function cleanExpiredAlerts()
    {
        try {
            $cleaned = PatientAlert::where('is_active', true)
                ->where('expires_at', '<', Carbon::now())
                ->update(['is_active' => false]);

            \Log::info('Alertas expirados limpos: ' . $cleaned);
            
            return response()->json([
                'message' => 'Alertas limpos',
                'count' => $cleaned
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Erro ao limpar alertas: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Erro ao limpar alertas',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

