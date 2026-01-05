<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\MedicationCatalog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ImportMedicationsFromCSV extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'medications:import 
                            {file : Caminho do arquivo CSV}
                            {--chunk=1000 : Tamanho do chunk para processamento}
                            {--skip-duplicates : Pular duplicatas sem avisar}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Importar medicamentos de arquivo CSV da ANVISA para o banco de dados';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $filePath = $this->argument('file');
        $chunkSize = (int) $this->option('chunk');
        $skipDuplicates = $this->option('skip-duplicates');

        if (!file_exists($filePath)) {
            $this->error("Arquivo não encontrado: {$filePath}");
            return 1;
        }

        $this->info("📥 Importando medicamentos de: {$filePath}");
        $this->info("📊 Tamanho do chunk: {$chunkSize}");

        // Abrir arquivo
        $handle = fopen($filePath, 'r');
        if (!$handle) {
            $this->error("Erro ao abrir arquivo: {$filePath}");
            return 1;
        }

        // Ler cabeçalho
        $header = fgetcsv($handle, 0, ';');
        if (!$header) {
            $this->error("Erro ao ler cabeçalho do CSV");
            fclose($handle);
            return 1;
        }

        // Mapear colunas
        $columnMap = $this->mapColumns($header);
        
        $this->info("✅ Colunas mapeadas:");
        foreach ($columnMap as $key => $index) {
            $this->line("   {$key}: coluna {$index}");
        }

        $totalLines = 0;
        $imported = 0;
        $skipped = 0;
        $duplicates = 0;
        $errors = 0;
        $chunk = [];

        // Contar total de linhas para a barra de progresso
        $this->info("\n📊 Contando linhas do arquivo...");
        $totalFileLines = 0;
        $tempHandle = fopen($filePath, 'r');
        if ($tempHandle) {
            fgetcsv($tempHandle, 0, ';'); // Pular cabeçalho
            while (fgetcsv($tempHandle, 0, ';') !== false) {
                $totalFileLines++;
            }
            fclose($tempHandle);
        }
        $this->info("   Total de linhas: " . number_format($totalFileLines, 0, ',', '.'));
        
        $this->info("\n🔄 Processando arquivo...");
        $bar = $this->output->createProgressBar($totalFileLines);
        $bar->setFormat(' %current%/%max% [%bar%] %percent:3s%% %elapsed:6s%/%estimated:-6s%');
        $bar->start();

        // Desabilitar logs durante importação para performance
        DB::connection()->disableQueryLog();

        try {
            while (($row = fgetcsv($handle, 0, ';')) !== false) {
                $totalLines++;
                $bar->advance(1); // Atualizar barra a cada linha
                
                // Pular linhas vazias
                if (empty(array_filter($row))) {
                    $skipped++;
                    continue;
                }

                try {
                    $data = $this->parseRow($row, $columnMap);
                    
                    if (empty($data['nome_produto'])) {
                        $skipped++;
                        continue;
                    }

                    // Normalizar dados
                    $data['nome_normalizado'] = MedicationCatalog::normalizeName($data['nome_produto']);
                    $data['search_keywords'] = MedicationCatalog::generateSearchKeywords(
                        $data['nome_produto'],
                        $data['principio_ativo'] ?? null
                    );
                    
                    // Verificar se é válido
                    $data['is_active'] = ($data['situacao_registro'] ?? '') === 'VÁLIDO';

                    // Verificar duplicata no chunk atual (mais rápido)
                    $isDuplicate = false;
                    foreach ($chunk as $existingItem) {
                        if (($existingItem['nome_normalizado'] ?? '') === $data['nome_normalizado'] &&
                            ($existingItem['numero_registro_produto'] ?? '') === ($data['numero_registro_produto'] ?? '')) {
                            $isDuplicate = true;
                            break;
                        }
                    }

                    if ($isDuplicate) {
                        $duplicates++;
                        continue;
                    }

                    $chunk[] = $data;

                    // Processar chunk quando atingir o tamanho
                    if (count($chunk) >= $chunkSize) {
                        $this->insertChunk($chunk);
                        $imported += count($chunk);
                        $chunk = [];
                    }

                } catch (\Exception $e) {
                    $errors++;
                    if ($this->getOutput()->isVerbose()) {
                        $this->warn("\nErro na linha {$totalLines}: " . $e->getMessage());
                    }
                }
            }

            // Processar chunk restante
            if (!empty($chunk)) {
                $this->insertChunk($chunk);
                $imported += count($chunk);
            }

            $bar->finish();

        } finally {
            fclose($handle);
            DB::connection()->enableQueryLog();
        }

        $this->newLine(2);
        $this->info("✅ Importação concluída!");
        $this->table(
            ['Métrica', 'Valor'],
            [
                ['Total de linhas processadas', number_format($totalLines, 0, ',', '.')],
                ['Medicamentos importados', number_format($imported, 0, ',', '.')],
                ['Linhas ignoradas (vazias)', number_format($skipped, 0, ',', '.')],
                ['Duplicatas encontradas', number_format($duplicates, 0, ',', '.')],
                ['Erros', number_format($errors, 0, ',', '.')],
            ]
        );

        // Estatísticas finais
        $totalInDb = MedicationCatalog::count();
        $activeInDb = MedicationCatalog::where('is_active', true)->count();
        
        $this->info("\n📊 Estatísticas do banco:");
        $this->line("   Total de medicamentos: {$totalInDb}");
        $this->line("   Medicamentos ativos: {$activeInDb}");

        return 0;
    }

    /**
     * Mapear colunas do CSV
     */
    private function mapColumns(array $header)
    {
        $map = [];
        
        foreach ($header as $index => $column) {
            $column = trim($column, '"');
            $column = strtoupper($column);
            
            switch ($column) {
                case 'NOME_PRODUTO':
                    $map['nome_produto'] = $index;
                    break;
                case 'PRINCIPIO_ATIVO':
                    $map['principio_ativo'] = $index;
                    break;
                case 'TIPO_PRODUTO':
                    $map['tipo_produto'] = $index;
                    break;
                case 'CATEGORIA_REGULATORIA':
                    $map['categoria_regulatoria'] = $index;
                    break;
                case 'NUMERO_REGISTRO_PRODUTO':
                    $map['numero_registro_produto'] = $index;
                    break;
                case 'DATA_VENCIMENTO_REGISTRO':
                    $map['data_vencimento_registro'] = $index;
                    break;
                case 'SITUACAO_REGISTRO':
                    $map['situacao_registro'] = $index;
                    break;
                case 'CLASSE_TERAPEUTICA':
                    $map['classe_terapeutica'] = $index;
                    break;
                case 'EMPRESA_DETENTORA_REGISTRO':
                    $map['empresa_detentora_registro'] = $index;
                    break;
                case 'DATA_FINALIZACAO_PROCESSO':
                    $map['data_finalizacao_processo'] = $index;
                    break;
                case 'NUMERO_PROCESSO':
                    $map['numero_processo'] = $index;
                    break;
            }
        }
        
        return $map;
    }

    /**
     * Parsear uma linha do CSV
     */
    private function parseRow(array $row, array $columnMap)
    {
        $data = [];
        
        foreach ($columnMap as $key => $index) {
            $value = $row[$index] ?? null;
            
            if ($value !== null) {
                // Remover aspas
                $value = trim($value, '"');
                
                // Processar datas
                if (strpos($key, 'data_') === 0) {
                    $value = $this->parseDate($value);
                }
                
                $data[$key] = $value ?: null;
            }
        }
        
        return $data;
    }

    /**
     * Parsear data do formato brasileiro
     */
    private function parseDate($dateString)
    {
        if (empty($dateString)) {
            return null;
        }

        // Formato: DD/MM/YYYY
        $parts = explode('/', $dateString);
        if (count($parts) === 3) {
            $day = (int) $parts[0];
            $month = (int) $parts[1];
            $year = (int) $parts[2];
            
            if (checkdate($month, $day, $year)) {
                return sprintf('%04d-%02d-%02d', $year, $month, $day);
            }
        }
        
        return null;
    }

    /**
     * Inserir chunk no banco (bulk insert com verificação de duplicatas)
     */
    private function insertChunk(array $chunk)
    {
        if (empty($chunk)) {
            return;
        }

        // Verificar duplicatas antes de inserir
        $toInsert = [];
        $seen = [];
        $now = now();

        foreach ($chunk as $item) {
            $key = ($item['nome_normalizado'] ?? '') . '|' . ($item['numero_registro_produto'] ?? '');
            
            if (!isset($seen[$key])) {
                $seen[$key] = true;
                // Adicionar timestamps
                $item['created_at'] = $now;
                $item['updated_at'] = $now;
                $toInsert[] = $item;
            }
        }

        if (!empty($toInsert)) {
            // Usar insertOrIgnore para evitar duplicatas no banco
            DB::table('medication_catalog')->insertOrIgnore($toInsert);
        }
    }
}

