<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ImportMedicationsFast extends Command
{
    protected $signature = 'medications:import-fast {file}';
    protected $description = 'Importação rápida de medicamentos (CSV já processado)';

    public function handle()
    {
        $filePath = $this->argument('file');
        
        if (!file_exists($filePath)) {
            $this->error("Arquivo não encontrado: {$filePath}");
            return 1;
        }

        $this->info("📥 Importação rápida de: {$filePath}");
        
        // Desabilitar query log para performance
        DB::connection()->disableQueryLog();
        
        $handle = fopen($filePath, 'r');
        if (!$handle) {
            $this->error("Erro ao abrir arquivo");
            return 1;
        }

        // Ler cabeçalho
        $header = fgetcsv($handle, 0, ';');
        
        $chunk = [];
        $chunkSize = 5000; // Chunks maiores
        $imported = 0;
        $totalLines = 0;
        
        $this->info("🔄 Processando...");
        $bar = $this->output->createProgressBar();
        $bar->start();

        try {
            while (($row = fgetcsv($handle, 0, ';')) !== false) {
                $totalLines++;
                
                if (count($row) < 13) {
                    continue;
                }

                // Mapear campos conforme ordem do CSV processado
                $data = [
                    'tipo_produto' => !empty($row[0]) ? trim($row[0]) : null,
                    'nome_produto' => !empty($row[1]) ? trim($row[1]) : '',
                    'nome_normalizado' => !empty($row[2]) ? trim($row[2]) : '',
                    'principio_ativo' => !empty($row[3]) ? trim($row[3]) : null,
                    'categoria_regulatoria' => !empty($row[4]) ? trim($row[4]) : null,
                    'numero_registro_produto' => !empty($row[5]) ? trim($row[5]) : null,
                    'data_vencimento_registro' => !empty($row[6]) && $row[6] !== 'NULL' ? trim($row[6]) : null,
                    'numero_processo' => !empty($row[7]) ? trim($row[7]) : null,
                    'classe_terapeutica' => !empty($row[8]) ? trim($row[8]) : null,
                    'empresa_detentora_registro' => !empty($row[9]) ? trim($row[9]) : null,
                    'data_finalizacao_processo' => !empty($row[10]) && $row[10] !== 'NULL' ? trim($row[10]) : null,
                    'situacao_registro' => !empty($row[11]) ? trim($row[11]) : null,
                    'is_active' => isset($row[12]) ? (int)$row[12] : 0,
                    'search_keywords' => null, // Será preenchido depois se necessário
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                
                // Validar e limpar dados
                if (empty($data['nome_produto'])) {
                    continue;
                }
                
                // Limitar tamanho dos campos conforme schema
                $data['nome_produto'] = mb_substr($data['nome_produto'], 0, 500);
                $data['nome_normalizado'] = mb_substr($data['nome_normalizado'], 0, 500);
                $data['principio_ativo'] = $data['principio_ativo'] ? mb_substr($data['principio_ativo'], 0, 500) : null;
                $data['tipo_produto'] = $data['tipo_produto'] ? mb_substr($data['tipo_produto'], 0, 100) : null;
                $data['categoria_regulatoria'] = $data['categoria_regulatoria'] ? mb_substr($data['categoria_regulatoria'], 0, 100) : null;
                $data['numero_registro_produto'] = $data['numero_registro_produto'] ? mb_substr($data['numero_registro_produto'], 0, 50) : null;
                $data['situacao_registro'] = $data['situacao_registro'] ? mb_substr($data['situacao_registro'], 0, 50) : null;
                $data['classe_terapeutica'] = $data['classe_terapeutica'] ? mb_substr($data['classe_terapeutica'], 0, 200) : null;
                $data['empresa_detentora_registro'] = $data['empresa_detentora_registro'] ? mb_substr($data['empresa_detentora_registro'], 0, 500) : null;
                $data['numero_processo'] = $data['numero_processo'] ? mb_substr($data['numero_processo'], 0, 100) : null;

                $chunk[] = $data;

                if (count($chunk) >= $chunkSize) {
                    try {
                        DB::table('medication_catalog')->insertOrIgnore($chunk);
                        $imported += count($chunk);
                        $bar->advance(count($chunk));
                    } catch (\Exception $e) {
                        $this->error("\nErro ao inserir chunk: " . $e->getMessage());
                        // Tentar inserir um por um para identificar o problema
                        foreach ($chunk as $item) {
                            try {
                                DB::table('medication_catalog')->insertOrIgnore($item);
                                $imported++;
                            } catch (\Exception $e2) {
                                $this->warn("Erro ao inserir item: " . $e2->getMessage());
                            }
                        }
                    }
                    $chunk = [];
                }
            }

            // Processar chunk restante
            if (!empty($chunk)) {
                try {
                    DB::table('medication_catalog')->insertOrIgnore($chunk);
                    $imported += count($chunk);
                    $bar->advance(count($chunk));
                } catch (\Exception $e) {
                    $this->error("\nErro ao inserir chunk final: " . $e->getMessage());
                    foreach ($chunk as $item) {
                        try {
                            DB::table('medication_catalog')->insertOrIgnore($item);
                            $imported++;
                        } catch (\Exception $e2) {
                            // Ignorar erros individuais no chunk final
                        }
                    }
                }
            }

            $bar->finish();
            
        } finally {
            fclose($handle);
            DB::connection()->enableQueryLog();
        }

        $this->newLine(2);
        $this->info("✅ Importação concluída!");
        $this->line("   Linhas processadas: " . number_format($totalLines, 0, ',', '.'));
        $this->line("   Registros importados: " . number_format($imported, 0, ',', '.'));

        $total = DB::table('medication_catalog')->count();
        $this->line("   Total no banco: " . number_format($total, 0, ',', '.'));

        return 0;
    }
}

