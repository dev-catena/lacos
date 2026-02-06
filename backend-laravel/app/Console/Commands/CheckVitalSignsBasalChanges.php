<?php

namespace App\Console\Commands;

use App\Models\VitalSign;
use App\Models\User;
use App\Models\Group;
use App\Services\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CheckVitalSignsBasalChanges extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:check-vital-signs';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verificar sinais vitais com alteração acima de 50% da basal e notificar médicos';

    protected $notificationService;

    public function __construct()
    {
        parent::__construct();
        $this->notificationService = new NotificationService();
    }

    /**
     * Calcular valor basal (média dos últimos 7 dias)
     */
    protected function calculateBasal($groupId, $type, $days = 7)
    {
        $startDate = Carbon::now()->subDays($days);
        
        $vitalSigns = VitalSign::where('group_id', $groupId)
            ->where('type', $type)
            ->where('measured_at', '>=', $startDate)
            ->orderBy('measured_at', 'desc')
            ->get();

        if ($vitalSigns->isEmpty()) {
            return null;
        }

        $values = [];
        foreach ($vitalSigns as $vs) {
            $value = $vs->value;
            
            // Extrair valor numérico dependendo do tipo
            if ($type === 'blood_pressure' && is_array($value)) {
                // Para pressão arterial, usar média de sistólica e diastólica
                $systolic = $value['systolic'] ?? $value[0] ?? null;
                $diastolic = $value['diastolic'] ?? $value[1] ?? null;
                if ($systolic !== null && $diastolic !== null) {
                    $values[] = ($systolic + $diastolic) / 2;
                }
            } elseif (is_array($value) && count($value) > 0) {
                $values[] = is_numeric($value[0]) ? (float)$value[0] : null;
            } elseif (is_numeric($value)) {
                $values[] = (float)$value;
            }
        }

        $values = array_filter($values, function($v) { return $v !== null; });
        
        if (empty($values)) {
            return null;
        }

        return array_sum($values) / count($values);
    }

    /**
     * Extrair valor numérico de um sinal vital
     */
    protected function extractNumericValue($vitalSign)
    {
        $value = $vitalSign->value;
        $type = $vitalSign->type;

        if ($type === 'blood_pressure' && is_array($value)) {
            $systolic = $value['systolic'] ?? $value[0] ?? null;
            $diastolic = $value['diastolic'] ?? $value[1] ?? null;
            if ($systolic !== null && $diastolic !== null) {
                return ($systolic + $diastolic) / 2;
            }
        } elseif (is_array($value) && count($value) > 0) {
            return is_numeric($value[0]) ? (float)$value[0] : null;
        } elseif (is_numeric($value)) {
            return (float)$value;
        }

        return null;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Verificando sinais vitais para alterações acima de 50% da basal...');

        try {
            // Buscar sinais vitais das últimas 2 horas (para não processar muito antigos)
            $recentVitalSigns = VitalSign::where('measured_at', '>=', Carbon::now()->subHours(2))
                ->where('measured_at', '<=', Carbon::now())
                ->with(['group'])
                ->orderBy('measured_at', 'desc')
                ->get();

            $sentCount = 0;

            foreach ($recentVitalSigns as $vitalSign) {
                $group = $vitalSign->group;
                if (!$group) {
                    continue;
                }

                // Buscar médicos associados ao grupo (médicos que têm pacientes neste grupo)
                // Um médico pode ter pacientes através de consultas
                $doctors = User::where('profile', 'doctor')
                    ->whereHas('notificationPreferences', function($query) {
                        $query->where('vital_signs_basal_change', true);
                    })
                    ->whereHas('appointments', function($query) use ($group) {
                        $query->where('group_id', $group->id)
                              ->where('status', 'scheduled')
                              ->where('appointment_date', '>=', Carbon::now());
                    })
                    ->get();

                // Se não encontrou médicos via consultas, buscar médicos que têm pacientes na carteira
                // (através da relação de clientes)
                if ($doctors->isEmpty()) {
                    // Buscar médicos que têm este grupo como cliente
                    $doctors = User::where('profile', 'doctor')
                        ->whereHas('notificationPreferences', function($query) {
                            $query->where('vital_signs_basal_change', true);
                        })
                        ->get();
                }

                if ($doctors->isEmpty()) {
                    continue;
                }

                // Calcular valor basal
                $basalValue = $this->calculateBasal($vitalSign->group_id, $vitalSign->type);
                
                if ($basalValue === null) {
                    // Se não há histórico suficiente, não enviar notificação
                    continue;
                }

                // Extrair valor atual
                $currentValue = $this->extractNumericValue($vitalSign);
                
                if ($currentValue === null) {
                    continue;
                }

                // Calcular variação percentual
                $changePercent = abs(($currentValue - $basalValue) / $basalValue) * 100;

                // Verificar se alteração é maior que 50%
                if ($changePercent < 50) {
                    continue;
                }

                // Verificar se já foi enviada notificação para este sinal vital
                $existingNotification = \App\Models\Notification::where('type', 'vital_sign')
                    ->whereRaw("JSON_EXTRACT(data, '$.vital_sign_id') = ?", [$vitalSign->id])
                    ->where('created_at', '>=', Carbon::now()->subHours(1))
                    ->exists();

                if ($existingNotification) {
                    continue;
                }

                // Buscar paciente do grupo
                $patient = $group->members()
                    ->wherePivot('role', 'patient')
                    ->orWherePivot('role', 'priority_contact')
                    ->first();

                $patientName = $patient ? $patient->name : 'Paciente';

                // Enviar notificação para cada médico
                foreach ($doctors as $doctor) {
                    $title = 'Alteração Significativa em Sinais Vitais';
                    $message = "O paciente {$patientName} apresentou alteração de " . number_format($changePercent, 1) . "% ";
                    $message .= "no sinal vital {$vitalSign->type}.\n\n";
                    $message .= "Valor basal: " . number_format($basalValue, 2) . " {$vitalSign->unit}\n";
                    $message .= "Valor atual: " . number_format($currentValue, 2) . " {$vitalSign->unit}\n";
                    $message .= "Variação: " . number_format($changePercent, 1) . "%";

                    $this->notificationService->sendNotification(
                        $doctor,
                        'vital_sign',
                        $title,
                        $message,
                        [
                            'vital_sign_id' => $vitalSign->id,
                            'group_id' => $vitalSign->group_id,
                            'patient_id' => $patient ? $patient->id : null,
                            'patient_name' => $patientName,
                            'type' => $vitalSign->type,
                            'basal_value' => $basalValue,
                            'current_value' => $currentValue,
                            'change_percent' => $changePercent,
                        ],
                        false, // Não enviar WhatsApp por padrão
                        $vitalSign->group_id
                    );

                    $sentCount++;
                    $this->info("Notificação enviada para médico {$doctor->name} sobre alteração em {$vitalSign->type} do paciente {$patientName}");
                }
            }

            $this->info("Total de notificações enviadas: {$sentCount}");
            Log::info('CheckVitalSignsBasalChanges executado', ['sent_count' => $sentCount]);

            return 0;
        } catch (\Exception $e) {
            $this->error('Erro ao verificar sinais vitais: ' . $e->getMessage());
            Log::error('Erro em CheckVitalSignsBasalChanges: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return 1;
        }
    }
}
