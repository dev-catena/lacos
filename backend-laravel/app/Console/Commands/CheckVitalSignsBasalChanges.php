<?php

namespace App\Console\Commands;

use App\Models\VitalSign;
use App\Services\VitalSignBasalService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckVitalSignsBasalChanges extends Command
{
    protected $signature = 'notifications:check-vital-signs';

    protected $description = 'Verificar sinais vitais com alteração ≥50% da basal diária e notificar membros do grupo';

    public function handle(VitalSignBasalService $basalService): int
    {
        $this->info('Verificando sinais vitais contra basal (≥50%)...');

        try {
            $recent = VitalSign::where('measured_at', '>=', Carbon::now()->subHours(2))
                ->where('measured_at', '<=', Carbon::now())
                ->whereIn('type', VitalSignBasalService::TYPES)
                ->orderByDesc('measured_at')
                ->get();

            $sentCount = 0;
            foreach ($recent as $vitalSign) {
                $sentCount += $basalService->notifyGroupIfBasalExceeded($vitalSign);
            }

            $this->info("Total de notificações enviadas: {$sentCount}");
            Log::info('CheckVitalSignsBasalChanges executado', ['sent_count' => $sentCount]);

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Erro ao verificar sinais vitais: '.$e->getMessage());
            Log::error('Erro em CheckVitalSignsBasalChanges: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return self::FAILURE;
        }
    }
}
