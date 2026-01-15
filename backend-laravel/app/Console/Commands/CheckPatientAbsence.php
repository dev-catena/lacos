<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\AppointmentPaymentService;

/**
 * Comando para verificar ausência de paciente
 * 
 * Executar: php artisan payments:check-patient-absence
 * Agendar no cron: * * * * * cd /var/www/lacos-backend && php artisan payments:check-patient-absence
 */
class CheckPatientAbsence extends Command
{
    protected $signature = 'payments:check-patient-absence';
    protected $description = 'Verificar ausência de paciente e liberar pagamento para médico';

    public function handle()
    {
        $this->info('Verificando ausência de pacientes...');
        
        $paymentService = new AppointmentPaymentService();
        $released = $paymentService->checkPatientAbsence();
        
        if ($released > 0) {
            $this->info("✅ {$released} pagamento(s) liberado(s) por ausência de paciente");
        } else {
            $this->info('Nenhuma ausência detectada');
        }
        
        return 0;
    }
}

