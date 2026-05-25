<?php

namespace App\Console\Commands;

use App\Services\PanicWatchSyncService;
use Illuminate\Console\Command;

class SyncWatchPanicCommand extends Command
{
    protected $signature = 'panic:sync-watch-sos {--group= : ID do grupo (opcional)}';

    protected $description = 'Sincroniza alertas SOS dos smartwatches Thalamus com panic_events';

    public function handle(PanicWatchSyncService $syncService): int
    {
        $groupId = $this->option('group');
        $groupId = is_numeric($groupId) ? (int) $groupId : null;

        $result = $syncService->syncAll($groupId);

        $this->info(sprintf(
            'Sync concluído: %d criado(s), %d ignorado(s).',
            $result['created'],
            $result['skipped']
        ));

        return self::SUCCESS;
    }
}
