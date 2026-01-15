<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\AppointmentPaymentService;

/**
 * Comando para verificar ausência de médico
 * 
 * Executar: php artisan payments:check-doctor-absence
 * Agendar no cron: * * * * * cd /var/www/lacos-backend && php artisan payments:check-doctor-absence
 */
class CheckDoctorAbsence extends Command
{
    protected $signature = 'payments:check-doctor-absence';
    protected $description = 'Verificar ausência de médico e reembolsar se necessário';

    public function handle()
    {
        $this->info('Verificando ausência de médicos...');
        
        $paymentService = new AppointmentPaymentService();
        $refunded = $paymentService->checkDoctorAbsence();
        
        if ($refunded > 0) {
            $this->info("✅ {$refunded} reembolso(s) processado(s) por ausência de médico");
        } else {
            $this->info('Nenhuma ausência detectada');
        }
        
        return 0;
    }
}

