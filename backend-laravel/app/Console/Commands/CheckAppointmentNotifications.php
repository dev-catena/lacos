<?php

namespace App\Console\Commands;

use App\Services\AppointmentReminderService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckAppointmentNotifications extends Command
{
    protected $signature = 'notifications:check-appointments';

    protected $description = 'Enviar lembretes de compromissos (recorrentes ou únicos) para cuidadores e pacientes do grupo';

    public function handle(AppointmentReminderService $reminderService): int
    {
        $this->info('Verificando lembretes de compromissos...');

        try {
            $sentCount = $reminderService->processDueReminders();
            $this->info("Total de lembretes enviados: {$sentCount}");
            Log::info('CheckAppointmentNotifications executado', ['sent_count' => $sentCount]);

            return 0;
        } catch (\Exception $e) {
            $this->error('Erro ao verificar lembretes: '.$e->getMessage());
            Log::error('Erro em CheckAppointmentNotifications: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return 1;
        }
    }
}
