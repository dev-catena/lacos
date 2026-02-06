<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Models\User;
use App\Models\UserNotificationPreference;
use App\Services\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CheckAppointmentNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:check-appointments';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verificar consultas e enviar notificações 10 minutos antes';

    protected $notificationService;

    public function __construct()
    {
        parent::__construct();
        $this->notificationService = new NotificationService();
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Verificando consultas para notificações...');

        try {
            // Buscar consultas agendadas que estão 10 minutos antes do horário
            $now = Carbon::now();
            $tenMinutesFromNow = $now->copy()->addMinutes(10);
            
            // Buscar consultas entre agora e 10 minutos no futuro
            $appointments = Appointment::where('status', 'scheduled')
                ->whereBetween('appointment_date', [
                    $now->format('Y-m-d H:i:s'),
                    $tenMinutesFromNow->format('Y-m-d H:i:s')
                ])
                ->whereDoesntHave('notifications', function($query) {
                    $query->where('type', 'appointment')
                          ->where('created_at', '>=', Carbon::now()->subMinutes(15));
                })
                ->with(['group', 'doctor'])
                ->get();

            $sentCount = 0;

            foreach ($appointments as $appointment) {
                // Buscar médico associado à consulta
                $doctor = null;
                
                if ($appointment->doctor_id) {
                    // Tentar buscar na tabela users primeiro (médicos do sistema)
                    $doctor = User::where('id', $appointment->doctor_id)
                        ->where('profile', 'doctor')
                        ->first();
                }

                if (!$doctor) {
                    continue;
                }

                // Verificar se o médico tem preferência de notificação habilitada
                $preferences = $doctor->notificationPreferences;
                if (!$preferences || !$preferences->appointment_patient_notification) {
                    continue;
                }

                // Buscar paciente do grupo
                $patient = $appointment->group->members()
                    ->wherePivot('role', 'patient')
                    ->orWherePivot('role', 'priority_contact')
                    ->first();

                if (!$patient) {
                    continue;
                }

                // Verificar se já foi enviada notificação para esta consulta nos últimos 15 minutos
                $existingNotification = \App\Models\Notification::where('user_id', $doctor->id)
                    ->where('type', 'appointment')
                    ->whereRaw("JSON_EXTRACT(data, '$.appointment_id') = ?", [$appointment->id])
                    ->where('created_at', '>=', Carbon::now()->subMinutes(15))
                    ->exists();

                if ($existingNotification) {
                    continue;
                }

                // Enviar notificação ao médico
                $appointmentTime = Carbon::parse($appointment->appointment_date);
                $title = 'Consulta em 10 minutos';
                $message = "Você tem uma consulta agendada em 10 minutos com {$patient->name}.\n";
                $message .= "Horário: " . $appointmentTime->format('d/m/Y H:i') . "\n";
                if ($appointment->title) {
                    $message .= "Título: {$appointment->title}";
                }

                $this->notificationService->sendNotification(
                    $doctor,
                    'appointment',
                    $title,
                    $message,
                    [
                        'appointment_id' => $appointment->id,
                        'patient_id' => $patient->id,
                        'patient_name' => $patient->name,
                        'appointment_date' => $appointment->appointment_date,
                        'group_id' => $appointment->group_id,
                    ],
                    false, // Não enviar WhatsApp por padrão
                    $appointment->group_id
                );

                $sentCount++;
                $this->info("Notificação enviada para médico {$doctor->name} sobre consulta com {$patient->name}");
            }

            $this->info("Total de notificações enviadas: {$sentCount}");
            Log::info('CheckAppointmentNotifications executado', ['sent_count' => $sentCount]);

            return 0;
        } catch (\Exception $e) {
            $this->error('Erro ao verificar consultas: ' . $e->getMessage());
            Log::error('Erro em CheckAppointmentNotifications: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return 1;
        }
    }
}
