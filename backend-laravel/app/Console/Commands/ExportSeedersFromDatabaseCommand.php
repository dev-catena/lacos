<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

/**
 * Exporta o conteúdo atual das tabelas para database/seeders/*.php,
 * no mesmo estilo dos seeders existentes (updateOrInsert por id).
 *
 * Uso: php artisan db:export-seeders
 *      php artisan db:export-seeders --only=users,groups
 *      php artisan db:export-seeders --except=medication_catalog
 */
class ExportSeedersFromDatabaseCommand extends Command
{
    protected $signature = 'db:export-seeders
                            {--force : Não pedir confirmação}
                            {--only= : Lista separada por vírgulas (ex.: users,groups)}
                            {--except= : Tabelas a ignorar (ex.: medication_catalog)}';

    protected $description = 'Regenera seeders em database/seeders a partir dos dados atuais da base';

    /**
     * Ordem alinhada a DatabaseSeeder::run (classe Seeder => tabela).
     *
     * @var array<string, array{table: string, footer: string}>
     */
    protected array $definitions = [
        'UsersSeeder' => ['table' => 'users', 'footer' => 'users'],
        'PlansSeeder' => ['table' => 'plans', 'footer' => 'filter'],
        'MedicalSpecialtiesSeeder' => ['table' => 'medical_specialties', 'footer' => 'filter'],
        'SystemSettingsSeeder' => ['table' => 'system_settings', 'footer' => 'filter'],
        'InvitationCodesSeeder' => ['table' => 'invitation_codes', 'footer' => 'filter'],
        'MedicationCatalogSeeder' => ['table' => 'medication_catalog', 'footer' => 'filter'],
        'GroupsSeeder' => ['table' => 'groups', 'footer' => 'groups'],
        'GroupMembersSeeder' => ['table' => 'group_members', 'footer' => 'group_members'],
        'GroupSettingsSeeder' => ['table' => 'group_settings', 'footer' => 'filter'],
        'GroupActivitiesSeeder' => ['table' => 'group_activities', 'footer' => 'filter'],
        'GroupMessagesSeeder' => ['table' => 'group_messages', 'footer' => 'filter'],
        'AccompaniedPeopleSeeder' => ['table' => 'accompanied_people', 'footer' => 'filter'],
        'DoctorsSeeder' => ['table' => 'doctors', 'footer' => 'filter'],
        'UserPlansSeeder' => ['table' => 'user_plans', 'footer' => 'filter'],
        'EmergencyContactsSeeder' => ['table' => 'emergency_contacts', 'footer' => 'filter'],
        'DevicesSeeder' => ['table' => 'devices', 'footer' => 'filter'],
        'AppointmentExceptionsSeeder' => ['table' => 'appointment_exceptions', 'footer' => 'filter'],
        'AppointmentsSeeder' => ['table' => 'appointments', 'footer' => 'filter'],
        'PrescriptionsSeeder' => ['table' => 'prescriptions', 'footer' => 'filter'],
        'CaregiverCoursesSeeder' => ['table' => 'caregiver_courses', 'footer' => 'filter'],
        'CaregiverReviewsSeeder' => ['table' => 'caregiver_reviews', 'footer' => 'filter'],
        'ConversationMessagesSeeder' => ['table' => 'conversation_messages', 'footer' => 'filter'],
        'ConversationsSeeder' => ['table' => 'conversations', 'footer' => 'filter'],
        'MedicationLogsSeeder' => ['table' => 'medication_logs', 'footer' => 'filter'],
        'MedicationsSeeder' => ['table' => 'medications', 'footer' => 'medications'],
        'MessagesSeeder' => ['table' => 'messages', 'footer' => 'filter'],
        'NotificationsSeeder' => ['table' => 'notifications', 'footer' => 'filter'],
        'OrderItemsSeeder' => ['table' => 'order_items', 'footer' => 'filter'],
        'OrdersSeeder' => ['table' => 'orders', 'footer' => 'filter'],
        'PanicEventsSeeder' => ['table' => 'panic_events', 'footer' => 'filter'],
        'StoreDisputesSeeder' => ['table' => 'store_disputes', 'footer' => 'filter'],
        'StoreEscrowsSeeder' => ['table' => 'store_escrows', 'footer' => 'filter'],
        'StoreOrderItemsSeeder' => ['table' => 'store_order_items', 'footer' => 'filter'],
        'StoreOrdersSeeder' => ['table' => 'store_orders', 'footer' => 'filter'],
        'StoreTrackingEventsSeeder' => ['table' => 'store_tracking_events', 'footer' => 'filter'],
        'SuppliersSeeder' => ['table' => 'suppliers', 'footer' => 'filter'],
        'SupplierCategoriesSeeder' => ['table' => 'supplier_categories', 'footer' => 'filter'],
        'SupplierProductsSeeder' => ['table' => 'supplier_products', 'footer' => 'filter'],
        'VitalSignsSeeder' => ['table' => 'vital_signs', 'footer' => 'filter'],
    ];

    public function handle(): int
    {
        $only = $this->option('only')
            ? array_filter(array_map('trim', explode(',', (string) $this->option('only'))))
            : null;
        $except = $this->option('except')
            ? array_flip(array_filter(array_map('trim', explode(',', (string) $this->option('except')))))
            : [];

        if (! $this->option('force')) {
            if (! $this->confirm('Isto vai SOBRESCREVER os ficheiros em database/seeders (exceto DatabaseSeeder). Continuar?', false)) {
                return self::FAILURE;
            }
        }

        $base = database_path('seeders');
        $exported = 0;
        $skipped = 0;

        foreach ($this->definitions as $className => $meta) {
            $table = $meta['table'];

            if ($only !== null && ! in_array($table, $only, true)) {
                continue;
            }
            if (isset($except[$table])) {
                $this->warn("Ignorado (--except): {$table}");
                $skipped++;

                continue;
            }

            $path = $base.'/'.$className.'.php';

            if (! Schema::hasTable($table)) {
                $this->warn("Tabela inexistente, ficheiro não escrito: {$table} ({$className})");
                $skipped++;

                continue;
            }

            try {
                $records = $this->loadRecords($table);
                $body = $this->buildSeederPhp($className, $table, $meta['footer'], $records);
                file_put_contents($path, $body);
                $this->info(sprintf('%s ← %d linhas', $className, count($records)));
                $exported++;
            } catch (Throwable $e) {
                $this->error("Falha {$className}: ".$e->getMessage());

                return self::FAILURE;
            }
        }

        $this->newLine();
        $this->info("Concluído: {$exported} seeders escritos, {$skipped} ignorados.");

        return self::SUCCESS;
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function loadRecords(string $table): array
    {
        $q = DB::table($table);
        if (Schema::hasColumn($table, 'id')) {
            $q->orderBy('id');
        }
        $rows = $q->get();

        return $rows->map(function ($row) {
            $arr = json_decode(json_encode($row), true);

            return is_array($arr) ? $this->normalizeExportRow($arr) : [];
        })->values()->all();
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    protected function normalizeExportRow(array $row): array
    {
        foreach ($row as $k => $v) {
            if (is_float($v) && (fmod($v, 1.0) === 0.0)) {
                $row[$k] = (int) $v;
            }
        }

        return $row;
    }

    /**
     * @param  list<array<string, mixed>>  $records
     */
    protected function buildSeederPhp(string $className, string $table, string $footerKind, array $records): string
    {
        $export = var_export($records, true);
        $export = preg_replace('/^/m', '        ', $export);

        $uses = "use Illuminate\Database\Seeder;\nuse Illuminate\Support\Facades\DB;\nuse Illuminate\Support\Facades\Schema;";
        $footer = $this->renderFooter($footerKind, $table);

        return <<<PHP
<?php

namespace Database\Seeders;

{$uses}

class {$className} extends Seeder
{
    /**
     * Run the database seeds.
     * Gerado por: php artisan db:export-seeders
     */
    public function run(): void
    {
        \$records = {$export};

{$footer}
    }
}

PHP;
    }

    protected function renderFooter(string $kind, string $table): string
    {
        return match ($kind) {
            'users' => <<<'PHP'
        $existingColumns = array_flip(Schema::getColumnListing('users'));
        $columnMap = ['profile_photo' => 'photo_url', 'email_verified' => 'email_verified_at', 'user_type' => 'role'];
        foreach ($records as $record) {
            $filtered = [];
            foreach ($record as $key => $value) {
                $col = $columnMap[$key] ?? $key;
                if (isset($existingColumns[$col])) {
                    $filtered[$col] = $value;
                }
            }
            if (isset($filtered['email_verified_at']) && $filtered['email_verified_at'] === 0) {
                $filtered['email_verified_at'] = null;
            } elseif (isset($filtered['email_verified_at']) && $filtered['email_verified_at'] === 1) {
                $filtered['email_verified_at'] = now();
            }
            if (isset($filtered['role']) && ! in_array($filtered['role'], ['caregiver', 'admin', 'health_professional'], true)) {
                $filtered['role'] = 'caregiver';
            }
            DB::table('users')->updateOrInsert(['id' => $record['id']], $filtered);
        }
PHP,
            'groups' => <<<'PHP'
        $existingColumns = array_flip(Schema::getColumnListing('groups'));
        foreach ($records as $record) {
            $filtered = array_intersect_key($record, $existingColumns);
            $filtered['created_at'] = $filtered['created_at'] ?? now();
            $filtered['accompanied_name'] = $filtered['accompanied_name'] ?? $filtered['name'] ?? 'Acompanhado';
            DB::table('groups')->updateOrInsert(['id' => $record['id']], $filtered);
        }
PHP,
            'group_members' => <<<'PHP'
        $existingColumns = array_flip(Schema::getColumnListing('group_members'));
        $validRoles = ['admin', 'member', 'viewer', 'caregiver', 'health_professional', 'priority_contact', 'patient'];
        foreach ($records as $record) {
            $filtered = array_intersect_key($record, $existingColumns);
            if (isset($filtered['role']) && ! in_array($filtered['role'], $validRoles, true)) {
                $filtered['role'] = 'member';
            }
            DB::table('group_members')->updateOrInsert(['id' => $record['id']], $filtered);
        }
PHP,
            'medications' => <<<'PHP'
        $existingColumns = array_flip(Schema::getColumnListing('medications'));
        foreach ($records as $record) {
            $filtered = array_intersect_key($record, $existingColumns);
            if (! isset($filtered['times']) && isset($record['time'])) {
                $filtered['times'] = json_encode([$record['time']]);
            }
            if (isset($filtered['start_date']) && strlen((string) $filtered['start_date']) <= 10) {
                $filtered['start_date'] .= ' 00:00:00';
            } elseif (! isset($filtered['start_date'])) {
                $filtered['start_date'] = now();
            }
            $filtered['pharmaceutical_form'] = $filtered['pharmaceutical_form'] ?? 'Comprimido';
            $filtered['unit'] = $filtered['unit'] ?? 'mg';
            $filtered['administration_route'] = $filtered['administration_route'] ?? 'Oral';
            DB::table('medications')->updateOrInsert(['id' => $record['id']], $filtered);
        }
PHP,
            default => $this->filterFooter($table),
        };
    }

    protected function filterFooter(string $table): string
    {
        $safeTable = addslashes($table);

        return <<<PHP
        \$existingColumns = array_flip(Schema::getColumnListing('{$safeTable}'));
        foreach (\$records as \$record) {
            \$filtered = array_intersect_key(\$record, \$existingColumns);
            DB::table('{$safeTable}')->updateOrInsert(
                ['id' => \$record['id']],
                \$filtered
            );
        }
PHP;
    }
}
