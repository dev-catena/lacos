<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Tabelas que devem ser ignoradas (sistema/cache)
$ignoreTables = [
    'cache',
    'cache_locks',
    'failed_jobs',
    'job_batches',
    'jobs',
    'migrations',
    'password_reset_tokens',
    'personal_access_tokens',
    'sessions',
];

// Obter todas as tabelas
$tables = DB::select('SHOW TABLES');
$dbName = config('database.connections.mysql.database');
$key = 'Tables_in_' . $dbName;

$seedersDir = __DIR__ . '/database/seeders';
if (!is_dir($seedersDir)) {
    mkdir($seedersDir, 0755, true);
}

foreach ($tables as $tableObj) {
    $tableName = $tableObj->$key;
    
    // Ignorar tabelas do sistema
    if (in_array($tableName, $ignoreTables)) {
        echo "Ignorando tabela: $tableName\n";
        continue;
    }
    
    echo "Processando tabela: $tableName\n";
    
    // Obter dados da tabela
    $data = DB::table($tableName)->get();
    
    if ($data->isEmpty()) {
        echo "  Tabela vazia, criando seeder vazio\n";
        $dataArray = [];
    } else {
        echo "  Encontrados {$data->count()} registros\n";
        $dataArray = $data->toArray();
    }
    
    // Converter objetos para arrays
    $records = [];
    foreach ($dataArray as $record) {
        $records[] = (array) $record;
    }
    
    // Nome da classe do seeder
    $className = str_replace('_', '', ucwords($tableName, '_')) . 'Seeder';
    
    // Gerar conteúdo do seeder
    $seederContent = "<?php\n\n";
    $seederContent .= "namespace Database\Seeders;\n\n";
    $seederContent .= "use Illuminate\Database\Seeder;\n";
    $seederContent .= "use Illuminate\Support\Facades\DB;\n\n";
    $seederContent .= "class {$className} extends Seeder\n";
    $seederContent .= "{\n";
    $seederContent .= "    /**\n";
    $seederContent .= "     * Run the database seeds.\n";
    $seederContent .= "     *\n";
    $seederContent .= "     * @return void\n";
    $seederContent .= "     */\n";
    $seederContent .= "    public function run()\n";
    $seederContent .= "    {\n";
    
    if (!empty($records)) {
        // Obter chave primária da tabela
        $primaryKey = 'id';
        $keyInfo = DB::select("SHOW KEYS FROM `{$tableName}` WHERE Key_name = 'PRIMARY'");
        if (!empty($keyInfo)) {
            $primaryKey = $keyInfo[0]->Column_name;
        }
        
        $seederContent .= "        \$records = " . var_export($records, true) . ";\n\n";
        $seederContent .= "        foreach (\$records as \$record) {\n";
        
        // Se tem chave primária, usar updateOrInsert
        if (!empty($keyInfo) && isset($records[0][$primaryKey])) {
            $seederContent .= "            DB::table('{$tableName}')->updateOrInsert(\n";
            $seederContent .= "                ['{$primaryKey}' => \$record['{$primaryKey}']],\n";
            $seederContent .= "                \$record\n";
            $seederContent .= "            );\n";
        } else {
            // Sem chave primária ou sem ID, usar insertOrIgnore
            $seederContent .= "            DB::table('{$tableName}')->insertOrIgnore(\$record);\n";
        }
        
        $seederContent .= "        }\n";
    } else {
        $seederContent .= "        // Tabela vazia - nenhum dado para inserir\n";
    }
    
    $seederContent .= "    }\n";
    $seederContent .= "}\n";
    
    // Salvar arquivo do seeder
    $seederFile = $seedersDir . '/' . $className . '.php';
    file_put_contents($seederFile, $seederContent);
    echo "  Seeder criado: {$className}.php\n\n";
}

// Atualizar DatabaseSeeder para incluir todos os seeders
echo "Atualizando DatabaseSeeder...\n";

$databaseSeederContent = "<?php\n\n";
$databaseSeederContent .= "namespace Database\Seeders;\n\n";
$databaseSeederContent .= "use Illuminate\Database\Seeder;\n\n";
$databaseSeederContent .= "class DatabaseSeeder extends Seeder\n";
$databaseSeederContent .= "{\n";
$databaseSeederContent .= "    /**\n";
$databaseSeederContent .= "     * Seed the application's database.\n";
$databaseSeederContent .= "     *\n";
$databaseSeederContent .= "     * @return void\n";
$databaseSeederContent .= "     */\n";
$databaseSeederContent .= "    public function run()\n";
$databaseSeederContent .= "    {\n";

// Adicionar chamadas para todos os seeders criados
foreach ($tables as $tableObj) {
    $tableName = $tableObj->$key;
    if (in_array($tableName, $ignoreTables)) {
        continue;
    }
    $className = str_replace('_', '', ucwords($tableName, '_')) . 'Seeder';
    $databaseSeederContent .= "        \$this->call({$className}::class);\n";
}

$databaseSeederContent .= "    }\n";
$databaseSeederContent .= "}\n";

file_put_contents($seedersDir . '/DatabaseSeeder.php', $databaseSeederContent);
echo "DatabaseSeeder atualizado!\n";

echo "\n✅ Seeders gerados com sucesso!\n";

