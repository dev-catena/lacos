<?php

/**
 * Importador de Farmácias Populares - Versão Melhorada
 * 
 * Este script importa farmácias do arquivo CSV oficial do Ministério da Saúde
 * 
 * USO:
 * 1. Baixe o arquivo Excel do site oficial
 * 2. Converta para CSV (UTF-8, delimitador vírgula ou ponto-e-vírgula)
 * 3. Coloque o arquivo como: /var/www/lacos-backend/farmacias_populares.csv
 * 4. Execute: php importador_farmacias_melhorado.php
 */

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\PopularPharmacy;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Configurações
$csvFile = __DIR__ . '/farmacias_populares.csv';
$delimiters = [',', ';', "\t"]; // Delimitadores possíveis
$skipHeader = true; // Pular primeira linha (cabeçalho)

echo "═══════════════════════════════════════════════════════════\n";
echo "🏥 IMPORTADOR DE FARMÁCIAS POPULARES\n";
echo "═══════════════════════════════════════════════════════════\n\n";

// Verificar arquivo
if (!file_exists($csvFile)) {
    die("❌ ERRO: Arquivo não encontrado: {$csvFile}\n\n");
}

$fileSize = filesize($csvFile);
if ($fileSize < 10) {
    die("❌ ERRO: Arquivo muito pequeno ({$fileSize} bytes). O arquivo está vazio ou corrompido.\n\n");
}

echo "📁 Arquivo: {$csvFile}\n";
echo "📊 Tamanho: " . number_format($fileSize) . " bytes\n\n";

// Detectar delimitador e encoding
$firstLines = [];
$handle = fopen($csvFile, 'r');
if ($handle === false) {
    die("❌ Erro ao abrir arquivo\n");
}

// Ler primeiras 3 linhas para análise
for ($i = 0; $i < 3; $i++) {
    $line = fgets($handle);
    if ($line !== false) {
        $firstLines[] = $line;
    }
}
rewind($handle);

// Detectar delimitador
$bestDelimiter = ',';
$maxFields = 0;

foreach ($delimiters as $delimiter) {
    $fields = str_getcsv($firstLines[0] ?? '', $delimiter);
    if (count($fields) > $maxFields) {
        $maxFields = count($fields);
        $bestDelimiter = $delimiter;
    }
}

echo "🔍 Delimitador detectado: '" . ($bestDelimiter === "\t" ? "TAB" : $bestDelimiter) . "'\n";

// Ler cabeçalho
if ($skipHeader) {
    $header = fgetcsv($handle, 0, $bestDelimiter);
    echo "📋 Cabeçalho (" . count($header) . " colunas):\n";
    foreach ($header as $i => $col) {
        echo "   [$i] " . trim($col) . "\n";
    }
    echo "\n";
}

// Estatísticas
$stats = [
    'total' => 0,
    'imported' => 0,
    'skipped' => 0,
    'duplicates' => 0,
    'errors' => 0,
];

echo "🔄 Iniciando importação...\n\n";

// Função para mapear colunas automaticamente
function mapColumns($data, $header = null) {
    $result = [
        'name' => '',
        'address' => '',
        'neighborhood' => '',
        'city' => '',
        'state' => '',
        'zip_code' => '',
        'phone' => '',
    ];
    
    // Se tiver cabeçalho, tentar mapear por nome
    if ($header) {
        foreach ($header as $i => $colName) {
            $colName = strtolower(trim($colName));
            $val = trim($data[$i] ?? '');
            
            if (stripos($colName, 'nome') !== false || stripos($colName, 'farmácia') !== false || stripos($colName, 'farmacia') !== false) {
                $result['name'] = $val;
            } elseif (stripos($colName, 'endereço') !== false || stripos($colName, 'endereco') !== false || stripos($colName, 'logradouro') !== false) {
                $result['address'] = $val;
            } elseif (stripos($colName, 'bairro') !== false) {
                $result['neighborhood'] = $val;
            } elseif (stripos($colName, 'cidade') !== false || stripos($colName, 'município') !== false || stripos($colName, 'municipio') !== false) {
                $result['city'] = $val;
            } elseif (stripos($colName, 'estado') !== false || stripos($colName, 'uf') !== false) {
                $result['state'] = $val;
            } elseif (stripos($colName, 'cep') !== false) {
                $result['zip_code'] = $val;
            } elseif (stripos($colName, 'telefone') !== false || stripos($colName, 'fone') !== false || stripos($colName, 'tel') !== false) {
                $result['phone'] = $val;
            }
        }
    }
    
    // Fallback: usar índices padrão se mapeamento não funcionou
    if (empty($result['name']) && isset($data[0])) {
        $result['name'] = trim($data[0]);
    }
    if (empty($result['address']) && isset($data[1])) {
        $result['address'] = trim($data[1]);
    }
    if (empty($result['city']) && isset($data[2])) {
        $result['city'] = trim($data[2]);
    }
    if (empty($result['state']) && isset($data[3])) {
        $result['state'] = trim($data[3]);
    }
    
    return $result;
}

// Processar linhas
while (($data = fgetcsv($handle, 0, $bestDelimiter)) !== false) {
    $stats['total']++;
    
    // Pular linhas vazias
    if (empty(array_filter($data))) {
        $stats['skipped']++;
        continue;
    }
    
    // Mapear colunas
    $mapped = mapColumns($data, $header ?? null);
    
    // Validação básica
    if (empty($mapped['name']) || empty($mapped['city'])) {
        $stats['skipped']++;
        if ($stats['skipped'] <= 3) {
            echo "⚠️  Linha {$stats['total']} pulada: dados insuficientes\n";
        }
        continue;
    }
    
    // Normalizar estado (2 caracteres, maiúsculo)
    $mapped['state'] = strtoupper(substr(trim($mapped['state']), 0, 2));
    
    // Validar estado (deve ser uma UF válida)
    $validStates = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
    if (!in_array($mapped['state'], $validStates)) {
        $stats['skipped']++;
        continue;
    }
    
    // Verificar duplicata
    try {
        $exists = PopularPharmacy::where('name', $mapped['name'])
            ->where('city', $mapped['city'])
            ->where(function($query) use ($mapped) {
                if (!empty($mapped['address'])) {
                    $query->where('address', $mapped['address']);
                }
            })
            ->first();
        
        if ($exists) {
            $stats['duplicates']++;
            continue;
        }
        
        // Criar registro
        PopularPharmacy::create([
            'name' => $mapped['name'],
            'address' => $mapped['address'] ?: null,
            'neighborhood' => $mapped['neighborhood'] ?: null,
            'city' => $mapped['city'],
            'state' => $mapped['state'],
            'zip_code' => $mapped['zip_code'] ?: null,
            'phone' => $mapped['phone'] ?: null,
            'latitude' => null,
            'longitude' => null,
            'is_active' => true,
        ]);
        
        $stats['imported']++;
        
        // Mostrar progresso
        if ($stats['imported'] <= 5) {
            echo "✅ [{$stats['imported']}] {$mapped['name']} - {$mapped['city']}/{$mapped['state']}\n";
        } elseif ($stats['imported'] % 50 === 0) {
            echo "✅ Importadas {$stats['imported']} farmácias...\n";
        }
        
    } catch (\Exception $e) {
        $stats['errors']++;
        if ($stats['errors'] <= 3) {
            echo "❌ Erro na linha {$stats['total']}: " . $e->getMessage() . "\n";
        }
    }
}

fclose($handle);

// Resumo
echo "\n";
echo "═══════════════════════════════════════════════════════════\n";
echo "📊 RESUMO DA IMPORTAÇÃO\n";
echo "═══════════════════════════════════════════════════════════\n";
echo "Total de linhas processadas: {$stats['total']}\n";
echo "✅ Farmácias importadas: {$stats['imported']}\n";
echo "⚠️  Linhas puladas: {$stats['skipped']}\n";
echo "🔄 Duplicatas ignoradas: {$stats['duplicates']}\n";
echo "❌ Erros: {$stats['errors']}\n";
echo "═══════════════════════════════════════════════════════════\n";

if ($stats['imported'] === 0) {
    echo "\n⚠️  NENHUMA FARMÁCIA FOI IMPORTADA!\n\n";
    echo "Possíveis causas:\n";
    echo "1. Arquivo CSV vazio ou corrompido\n";
    echo "2. Formato do CSV não reconhecido\n";
    echo "3. Dados inválidos (sem nome ou cidade)\n\n";
    echo "SOLUÇÃO:\n";
    echo "1. Baixe o arquivo oficial do Ministério da Saúde\n";
    echo "2. Converta Excel para CSV (UTF-8)\n";
    echo "3. Verifique o arquivo: head -5 farmacias_populares.csv\n";
    echo "4. Execute novamente\n";
}

