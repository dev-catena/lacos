<?php

namespace App\Console\Commands;

use App\Models\MedicationCatalog;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Importa VTM, VMP e AMP a partir de um MySQL onde foi restaurado o dump do Portal OBM
 * (ex.: portal-obm-20250530.sql). Conexão: OBM_DB_* (veja registerObmSourceConnection).
 */
class ImportObmMedicationCatalogCommand extends Command
{
    protected $signature = 'obm:import-medications
        {--connection=obm_source : Nome da conexão com o banco OBM restaurado}
        {--only= : Lista separada por vírgula: vtm,vmp,amp (default: todos)}
        {--chunk=500 : Tamanho do lote para upsert}';

    protected $description = 'Importa catálogo OBM (VTM, VMP, AMP) de BD MySQL restaurado a partir do dump oficial';

    public function handle(): int
    {
        $connName = (string) $this->option('connection');
        $this->registerObmSourceConnection($connName);

        try {
            DB::connection($connName)->getPdo();
        } catch (\Throwable $e) {
            $this->error('Não foi possível conectar à base OBM ('.$connName.'): '.$e->getMessage());
            $this->line('Verifique usuário/host (erro 1698 com root: use um usuário com senha, ex. o mesmo de DB_USERNAME).');
            $this->line('Se o dump está na mesma base do app, omita OBM_DB_* ou defina igual a DB_*.');

            return self::FAILURE;
        }

        $only = collect(explode(',', (string) $this->option('only')))
            ->map(fn ($s) => strtolower(trim($s)))
            ->filter()
            ->values();

        if ($only->isEmpty()) {
            $only = collect(['vtm', 'vmp', 'amp']);
        }

        $chunk = max(50, (int) $this->option('chunk'));
        $importedAt = Carbon::now();
        $src = DB::connection($connName);

        if ($only->contains('vtm')) {
            $this->importVtm($src, $chunk, $importedAt);
        }
        if ($only->contains('vmp')) {
            $this->importVmp($src, $chunk, $importedAt);
        }
        if ($only->contains('amp')) {
            $this->importAmp($src, $chunk, $importedAt);
        }

        $this->info('Concluído.');

        return self::SUCCESS;
    }

    private function registerObmSourceConnection(string $name): void
    {
        Config::set("database.connections.{$name}", [
            'driver' => 'mysql',
            'host' => env('OBM_DB_HOST', env('DB_HOST', '127.0.0.1')),
            'port' => env('OBM_DB_PORT', env('DB_PORT', '3306')),
            'database' => env('OBM_DB_DATABASE', env('DB_DATABASE', 'dbportalobm')),
            'username' => env('OBM_DB_USERNAME', env('DB_USERNAME', 'root')),
            'password' => env('OBM_DB_PASSWORD', env('DB_PASSWORD', '')),
            'unix_socket' => env('OBM_DB_SOCKET', env('DB_SOCKET', '')),
            'charset' => env('OBM_DB_CHARSET', env('DB_CHARSET', 'utf8mb4')),
            'collation' => env('OBM_DB_COLLATION', env('DB_COLLATION', 'utf8mb4_unicode_ci')),
            'prefix' => '',
            'strict' => true,
            'engine' => null,
        ]);

        DB::purge($name);
    }

    private function importVtm(\Illuminate\Database\Connection $src, int $chunk, Carbon $importedAt): void
    {
        $this->line('Importando tb_vtm (VTM / princípio ativo ou combinação)…');
        $q = $src->table('tb_vtm')
            ->where('ST_REGISTRO_ATIVO', 'ACTIVE')
            ->whereNotNull('NU_VTMID')
            ->whereNotNull('NO_NM')
            ->where('NU_VTMID', '!=', '')
            ->where('NO_NM', '!=', '')
            ->orderBy('CO_SEQ_ID');

        $total = $q->clone()->count();
        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $q->clone()->chunk($chunk, function ($rows) use ($importedAt, $bar) {
            $batch = [];
            foreach ($rows as $r) {
                $name = (string) $r->NO_NM;
                $batch[] = $this->buildRow('vtm', (string) $r->NU_VTMID, $name, $name, null, null, null, $importedAt);
            }
            $this->upsertBatch($batch);
            $bar->advance(count($rows));
        });

        $bar->finish();
        $this->newLine();
        $this->info(sprintf('[VTM] %d registros considerados (ativos).', $total));
    }

    private function importVmp(\Illuminate\Database\Connection $src, int $chunk, Carbon $importedAt): void
    {
        $this->line('Importando tb_vmp (VMP / produto virtual genérico)…');
        $q = $src->table('tb_vmp')
            ->where('ST_REGISTRO_ATIVO', 'ACTIVE')
            ->where(function ($w) {
                $w->whereNull('ST_INVALID')->orWhere('ST_INVALID', '=', 0);
            })
            ->whereNotNull('NU_VPID')
            ->whereNotNull('NO_NM')
            ->orderBy('CO_SEQ_ID');

        $total = $q->clone()->count();
        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $q->clone()->chunk($chunk, function ($rows) use ($importedAt, $bar) {
            $batch = [];
            foreach ($rows as $r) {
                $name = (string) $r->NO_NM;
                $pa = MedicationCatalog::extractNameOnly($name);
                if ($pa === '') {
                    $pa = null;
                }
                $batch[] = $this->buildRow('vmp', (string) $r->NU_VPID, $name, $pa, null, null, null, $importedAt);
            }
            $this->upsertBatch($batch);
            $bar->advance(count($rows));
        });

        $bar->finish();
        $this->newLine();
        $this->info(sprintf('[VMP] %d registros considerados (ativos e não inválidos).', $total));
    }

    private function importAmp(\Illuminate\Database\Connection $src, int $chunk, Carbon $importedAt): void
    {
        $this->line('Importando tb_amp + td_supplier (AMP / nome comercial por fabricante)…');
        $q = $src->table('tb_amp as amp')
            ->leftJoin('td_supplier as sup', 'sup.CO_SEQ_ID', '=', 'amp.CO_SUPPCD')
            ->where('amp.ST_REGISTRO_ATIVO', 'ACTIVE')
            ->whereNotNull('amp.NU_APID')
            ->where('amp.NU_APID', '!=', '')
            ->select([
                'amp.NU_APID',
                'amp.NO_NM',
                'amp.DS_DESCR',
                'amp.NU_NREG',
                'sup.NO_DESCR as empresa_supplier',
            ])
            ->orderBy('amp.CO_SEQ_ID');

        $total = $q->clone()->count();
        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $q->clone()->chunk($chunk, function ($rows) use ($importedAt, $bar) {
            $batch = [];
            foreach ($rows as $r) {
                $descr = isset($r->DS_DESCR) && $r->DS_DESCR !== null && $r->DS_DESCR !== ''
                    ? (string) $r->DS_DESCR
                    : (string) $r->NO_NM;
                $empresa = isset($r->empresa_supplier) && $r->empresa_supplier !== ''
                    ? (string) $r->empresa_supplier
                    : MedicationCatalog::extractManufacturerFromAmpDescription($descr);
                $principio = MedicationCatalog::stripManufacturerSuffix($descr);
                if ($principio === '') {
                    $principio = null;
                }
                $nreg = isset($r->NU_NREG) && $r->NU_NREG !== null
                    ? Str::limit((string) $r->NU_NREG, 50, '')
                    : null;

                $batch[] = $this->buildRow('amp', (string) $r->NU_APID, $descr, $principio, $empresa, $nreg, null, $importedAt);
            }
            $this->upsertBatch($batch);
            $bar->advance(count($rows));
        });

        $bar->finish();
        $this->newLine();
        $this->info(sprintf('[AMP] %d registros considerados (ativos).', $total));
    }

    private function buildRow(
        string $entity,
        string $obmCode,
        string $nomeProduto,
        ?string $principioAtivo,
        ?string $empresa,
        ?string $numeroRegistro,
        ?string $classeTerapeutica,
        Carbon $importedAt
    ): array {
        $nomeProduto = Str::limit($nomeProduto, 700, '');
        $nomeNorm = Str::limit(MedicationCatalog::normalizeName($nomeProduto), 500, '');
        $kw = Str::limit(
            MedicationCatalog::generateSearchKeywords($nomeProduto, $principioAtivo),
            1000,
            ''
        );

        $now = $importedAt->format('Y-m-d H:i:s');

        return [
            'nome_produto' => $nomeProduto,
            'nome_normalizado' => $nomeNorm,
            'principio_ativo' => $principioAtivo !== null ? Str::limit($principioAtivo, 500, '') : null,
            'tipo_produto' => 'OBM-'.strtoupper($entity),
            'categoria_regulatoria' => null,
            'numero_registro_produto' => $numeroRegistro,
            'data_vencimento_registro' => null,
            'situacao_registro' => 'VÁLIDO',
            'classe_terapeutica' => $classeTerapeutica,
            'empresa_detentora_registro' => $empresa !== null ? Str::limit($empresa, 500, '') : null,
            'data_finalizacao_processo' => null,
            'numero_processo' => null,
            'is_active' => true,
            'search_keywords' => $kw,
            'obm_entity' => $entity,
            'obm_code' => Str::limit($obmCode, 40, ''),
            'obm_imported_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ];
    }

    private function upsertBatch(array $batch): void
    {
        if ($batch === []) {
            return;
        }

        MedicationCatalog::upsert(
            $batch,
            ['obm_entity', 'obm_code'],
            [
                'nome_produto',
                'nome_normalizado',
                'principio_ativo',
                'tipo_produto',
                'categoria_regulatoria',
                'numero_registro_produto',
                'data_vencimento_registro',
                'situacao_registro',
                'classe_terapeutica',
                'empresa_detentora_registro',
                'data_finalizacao_processo',
                'numero_processo',
                'is_active',
                'search_keywords',
                'obm_imported_at',
                'updated_at',
            ]
        );
    }
}
