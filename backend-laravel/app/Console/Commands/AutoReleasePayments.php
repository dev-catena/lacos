<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\AppointmentPaymentService;

/**
 * Comando para liberar automaticamente pagamentos após 6 horas
 * 
 * Executar: php artisan payments:auto-release
 * Agendar no cron: a cada 5 minutos
 */
class AutoReleasePayments extends Command
{
    protected $signature = 'payments:auto-release';
    protected $description = 'Liberar automaticamente pagamentos de consultas com mais de 6 horas';

    public function handle()
    {
        $this->info('Verificando consultas para liberação automática...');
        
        $paymentService = new AppointmentPaymentService();
        $released = $paymentService->autoReleaseAfter6Hours();
        
        if ($released > 0) {
            $this->info("✅ {$released} pagamento(s) liberado(s) automaticamente");
        } else {
            $this->info('Nenhum pagamento para liberar');
        }
        
        return 0;
    }
}

