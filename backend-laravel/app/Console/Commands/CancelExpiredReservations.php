<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CancelExpiredReservations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'appointments:cancel-expired-reservations';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Cancela consultas não pagas cuja reserva expirou (após 10 minutos)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Verificando reservas expiradas...');
        
        $now = Carbon::now();
        
        // Buscar consultas com reserva expirada e ainda não pagas
        $expiredAppointments = Appointment::where('payment_status', 'pending')
            ->whereNotNull('reserved_until')
            ->where('reserved_until', '<=', $now)
            ->where('status', '!=', 'cancelled')
            ->get();
        
        $count = 0;
        
        foreach ($expiredAppointments as $appointment) {
            try {
                // Cancelar a consulta
                $appointment->update([
                    'status' => 'cancelled',
                    'cancelled_by' => 'system',
                    'reserved_until' => null, // Limpar reserva
                ]);
                
                Log::info('Consulta com reserva expirada cancelada', [
                    'appointment_id' => $appointment->id,
                    'reserved_until' => $appointment->reserved_until,
                    'appointment_date' => $appointment->appointment_date,
                ]);
                
                $count++;
            } catch (\Exception $e) {
                Log::error('Erro ao cancelar consulta com reserva expirada', [
                    'appointment_id' => $appointment->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
        
        $this->info("{$count} consulta(s) com reserva expirada foram canceladas.");
        
        return 0;
    }
}
