<?php

namespace App\Console\Commands;

use App\Models\Group;
use App\Services\VitalSignBasalService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ComputeDailyVitalBasals extends Command
{
    protected $signature = 'vitals:compute-daily-basals
                            {--date= : Data Y-m-d (padrão: ontem)}
                            {--group= : ID de um grupo específico}';

    protected $description = 'Calcula e grava basal diária (média de até 8 amostras a cada 3h) por grupo';

    public function handle(VitalSignBasalService $basalService): int
    {
        $tz = config('app.timezone', 'America/Sao_Paulo');
        $dateOpt = $this->option('date');
        $day = $dateOpt
            ? Carbon::parse($dateOpt, $tz)->startOfDay()
            : Carbon::now($tz)->subDay()->startOfDay();

        $this->info('Calculando basais para '.$day->toDateString().'...');

        $query = Group::query();
        if ($this->option('group')) {
            $query->where('id', (int) $this->option('group'));
        }

        $saved = 0;
        $groups = 0;
        foreach ($query->cursor() as $group) {
            $groups++;
            $n = $basalService->computeAllForGroup((int) $group->id, $day);
            $saved += $n;
            if ($n > 0) {
                $this->line("Grupo {$group->id}: {$n} tipo(s) gravado(s)");
            }
        }

        $this->info("Grupos processados: {$groups}. Basais gravadas: {$saved}");
        Log::info('ComputeDailyVitalBasals', [
            'date' => $day->toDateString(),
            'groups' => $groups,
            'saved' => $saved,
        ]);

        return self::SUCCESS;
    }
}
