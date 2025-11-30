<?php

/**
 * Importador de Farmácias Populares - Versão para arquivo oficial do Ministério da Saúde
 * 
 * Este script importa farmácias do arquivo CSV oficial do Ministério da Saúde
 * O arquivo oficial tem muitas linhas vazias no início e estrutura específica
 * 
 * Estrutura do CSV oficial:
 * - Linhas vazias no início
 * - Informações do Ministério
 * - Cabeçalho: UF, CÓD. MUNICÍPIO, MUNICÍPIO, CNPJ, FARMÁCIA, ENDEREÇO, BAIRRO, Data do Credenciamento
 * - Dados começam após o cabeçalho
 */

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\PopularPharmacy;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Configurações
$csvFile = __DIR__ . '/farmacias_credenciadas.csv';
$delimiter = ','; // O arquivo oficial usa vírgula

echo "═══════════════════════════════════════════════════════════\n";
echo "🏥 IMPORTADOR DE FARMÁCIAS POPULARES (Arquivo Oficial)\n";
echo "═══════════════════════════════════════════════════════════\n\n";

// Verificar arquivo
if (!file_exists($csvFile)) {
    // Tentar nome alternativo
    $csvFile = __DIR__ . '/farmacias_populares.csv';
    if (!file_exists($csvFile)) {
        die("❌ ERRO: Arquivo não encontrado!\nProcure por: farmacias_credenciadas.csv ou farmacias_populares.csv\n\n");
    }
}

$fileSize = filesize($csvFile);
if ($fileSize < 100) {
    die("❌ ERRO: Arquivo muito pequeno ({$fileSize} bytes).\n\n");
}

echo "📁 Arquivo: {$csvFile}\n";
echo "📊 Tamanho: " . number_format($fileSize) . " bytes\n\n";

// Abrir arquivo
$handle = fopen($csvFile, 'r');
if ($handle === false) {
    die("❌ Erro ao abrir arquivo\n");
}

// Procurar cabeçalho real usando fgetcsv (melhor para lidar com quebras de linha em campos)
echo "🔍 Procurando cabeçalho...\n";

$headerIndex = null;
$foundHeader = false;
$lineNumber = 0;

// Procurar nas primeiras 50 linhas
while ($lineNumber < 50 && ($data = fgetcsv($handle, 0, $delimiter)) !== false) {
    $lineNumber++;
    
    // Pular linhas vazias
    if (empty(array_filter($data))) {
        continue;
    }
    
    // Juntar todos os campos em uma string para busca
    $lineText = implode(' ', array_filter($data));
    $lineUpper = mb_strtoupper($lineText, 'UTF-8');
    
    // Procurar por indicadores de cabeçalho
    $hasUF = (stripos($lineUpper, 'UF') !== false);
    $hasFarmacia = (stripos($lineUpper, 'FARMÁCIA') !== false || 
                    stripos($lineUpper, 'FARMACIA') !== false);
    $hasMunicipio = (stripos($lineUpper, 'MUNICÍPIO') !== false || 
                     stripos($lineUpper, 'MUNICIPIO') !== false);
    $hasEndereco = (stripos($lineUpper, 'ENDEREÇO') !== false || 
                    stripos($lineUpper, 'ENDERECO') !== false);
    
    // Se tem UF e pelo menos 2 outros campos do cabeçalho, verificar se é realmente cabeçalho
    if ($hasUF && ($hasFarmacia || $hasMunicipio) && ($hasEndereco || $hasMunicipio)) {
        // Verificar se a próxima linha tem dados válidos (se sim, esta é o cabeçalho)
        $currentPos = ftell($handle);
        $nextData = fgetcsv($handle, 0, $delimiter);
        fseek($handle, $currentPos); // Voltar
        
        // Se a próxima linha tem um estado válido (2 letras) na coluna 1, então esta linha é o cabeçalho
        if ($nextData && isset($nextData[1])) {
            $nextUF = strtoupper(trim($nextData[1]));
            $validStates = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
            
            if (in_array($nextUF, $validStates)) {
                // Esta linha é o cabeçalho, próxima tem dados válidos
                $headerIndex = $lineNumber;
                $foundHeader = true;
                echo "✅ Cabeçalho encontrado na linha {$lineNumber}\n";
                echo "   Campos: " . implode(', ', array_slice($data, 0, 5)) . "...\n";
                break;
            }
        }
    }
}

if (!$foundHeader) {
    // Tentar método alternativo: procurar linha que começa com vírgula e tem UF
    rewind($handle);
    $lineNumber = 0;
    
    while ($lineNumber < 50 && ($line = fgets($handle)) !== false) {
        $lineNumber++;
        $lineTrimmed = trim($line);
        
        // Verificar se linha começa com vírgula e contém UF e FARMACIA
        if (substr($lineTrimmed, 0, 1) === ',' && 
            stripos($lineTrimmed, 'UF') !== false && 
            (stripos($lineTrimmed, 'FARMÁCIA') !== false || stripos($lineTrimmed, 'FARMACIA') !== false)) {
            
            // Ler essa linha como CSV
            rewind($handle);
            for ($i = 0; $i < $lineNumber - 1; $i++) {
                fgetcsv($handle, 0, $delimiter);
            }
            $header = fgetcsv($handle, 0, $delimiter);
            $headerIndex = $lineNumber;
            $foundHeader = true;
            echo "✅ Cabeçalho encontrado na linha {$lineNumber} (método alternativo)\n";
            break;
        }
    }
}

if (!$foundHeader) {
    echo "⚠️  Cabeçalho não encontrado nas primeiras 50 linhas.\n";
    echo "📄 Verificando formato do arquivo...\n";
    
    // Mostrar algumas linhas para debug
    rewind($handle);
    for ($i = 0; $i < 20; $i++) {
        $line = fgets($handle);
        if ($line !== false) {
            echo "   Linha " . ($i + 1) . ": " . substr(trim($line), 0, 120) . "\n";
        }
    }
    
    die("\n❌ ERRO: Cabeçalho não encontrado!\n");
}

// Se encontrou pelo método alternativo, já temos o header
// Se não, ler novamente
if (!isset($header)) {
    rewind($handle);
    for ($i = 0; $i < $headerIndex - 1; $i++) {
        fgetcsv($handle, 0, $delimiter);
    }
    $header = fgetcsv($handle, 0, $delimiter);
}
echo "📋 Cabeçalho (" . count($header) . " colunas):\n";
foreach ($header as $i => $col) {
    echo "   [$i] " . trim($col) . "\n";
}
echo "\n";

// Mapear índices das colunas - baseado no formato conhecido do arquivo oficial
// Formato: ,UF,"CÓD. MUNICÍPIO",MUNICÍPIO,CNPJ,FARMÁCIA,ENDEREÇO,BAIRRO,Data do Credenciamento
$colIndexes = [
    'uf' => null,
    'municipio' => null,
    'farmacia' => null,
    'endereco' => null,
    'bairro' => null,
];

// Primeiro tentar mapear pelo nome da coluna
foreach ($header as $i => $col) {
    $colName = strtoupper(trim($col));
    // Remover quebras de linha e espaços extras
    $colName = preg_replace('/\s+/', ' ', $colName);
    
    if (stripos($colName, 'UF') !== false && $colIndexes['uf'] === null) {
        $colIndexes['uf'] = $i;
    } elseif ((stripos($colName, 'MUNICÍPIO') !== false || stripos($colName, 'MUNICIPIO') !== false) && 
              stripos($colName, 'CÓD') === false && $colIndexes['municipio'] === null) {
        $colIndexes['municipio'] = $i;
    } elseif (stripos($colName, 'FARMÁCIA') !== false || stripos($colName, 'FARMACIA') !== false) {
        $colIndexes['farmacia'] = $i;
    } elseif (stripos($colName, 'ENDEREÇO') !== false || stripos($colName, 'ENDERECO') !== false) {
        $colIndexes['endereco'] = $i;
    } elseif (stripos($colName, 'BAIRRO') !== false) {
        $colIndexes['bairro'] = $i;
    }
}

// Se não encontrou pelo nome, usar posições conhecidas do arquivo oficial
// Formato conhecido: [0]=vazio, [1]=UF, [2]=CÓD, [3]=MUNICÍPIO, [4]=CNPJ, [5]=FARMÁCIA, [6]=ENDEREÇO, [7]=BAIRRO
if ($colIndexes['uf'] === null && count($header) >= 2) {
    $colIndexes['uf'] = 1; // Posição conhecida
}

if ($colIndexes['municipio'] === null && count($header) >= 4) {
    $colIndexes['municipio'] = 3; // Posição conhecida
}

if ($colIndexes['farmacia'] === null && count($header) >= 6) {
    $colIndexes['farmacia'] = 5; // Posição conhecida
}

if ($colIndexes['endereco'] === null && count($header) >= 7) {
    $colIndexes['endereco'] = 6; // Posição conhecida
}

if ($colIndexes['bairro'] === null && count($header) >= 8) {
    $colIndexes['bairro'] = 7; // Posição conhecida
}

echo "📍 Mapeamento de colunas:\n";
foreach ($colIndexes as $key => $idx) {
    echo "   {$key}: coluna " . ($idx !== null ? $idx : 'NÃO ENCONTRADA') . "\n";
}
echo "\n";

// Validar mapeamento
if ($colIndexes['uf'] === null || $colIndexes['municipio'] === null || $colIndexes['farmacia'] === null) {
    die("❌ ERRO: Colunas essenciais não encontradas!\n");
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

// Estados válidos
$validStates = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

// Processar linhas
while (($data = fgetcsv($handle, 0, $delimiter)) !== false) {
    $stats['total']++;
    
    // Pular linhas vazias ou com poucos dados
    $nonEmptyFields = array_filter($data, function($val) {
        return !empty(trim($val));
    });
    
    if (count($nonEmptyFields) < 3) {
        $stats['skipped']++;
        continue;
    }
    
    // Extrair dados usando índices mapeados
    $uf = trim($data[$colIndexes['uf']] ?? '');
    $municipio = trim($data[$colIndexes['municipio']] ?? '');
    $farmacia = trim($data[$colIndexes['farmacia']] ?? '');
    $endereco = trim($data[$colIndexes['endereco']] ?? '');
    $bairro = trim($data[$colIndexes['bairro']] ?? '');
    
    // Validação
    if (empty($farmacia) || empty($municipio) || empty($uf)) {
        $stats['skipped']++;
        continue;
    }
    
    // Normalizar estado (2 caracteres, maiúsculo)
    $uf = strtoupper(substr($uf, 0, 2));
    
    // Validar estado
    if (!in_array($uf, $validStates)) {
        $stats['skipped']++;
        continue;
    }
    
    // Verificar duplicata
    try {
        $exists = PopularPharmacy::where('name', $farmacia)
            ->where('city', $municipio)
            ->where('state', $uf)
            ->where(function($query) use ($endereco) {
                if (!empty($endereco)) {
                    $query->where('address', $endereco);
                }
            })
            ->first();
        
        if ($exists) {
            $stats['duplicates']++;
            continue;
        }
        
        // Criar registro
        PopularPharmacy::create([
            'name' => $farmacia,
            'address' => $endereco ?: null,
            'neighborhood' => $bairro ?: null,
            'city' => $municipio,
            'state' => $uf,
            'zip_code' => null, // Não está no arquivo oficial
            'phone' => null, // Não está no arquivo oficial
            'latitude' => null, // Será preenchido depois com geocodificação
            'longitude' => null,
            'is_active' => true,
        ]);
        
        $stats['imported']++;
        
        // Mostrar progresso
        if ($stats['imported'] <= 5) {
            echo "✅ [{$stats['imported']}] {$farmacia} - {$municipio}/{$uf}\n";
        } elseif ($stats['imported'] % 100 === 0) {
            echo "✅ Importadas {$stats['imported']} farmácias...\n";
        }
        
    } catch (\Exception $e) {
        $stats['errors']++;
        if ($stats['errors'] <= 5) {
            echo "❌ Erro na linha {$stats['total']}: " . $e->getMessage() . "\n";
            echo "   Dados: {$farmacia} - {$municipio}/{$uf}\n";
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

if ($stats['imported'] > 0) {
    echo "\n✅ Importação concluída com sucesso!\n";
    echo "📊 Total de farmácias no banco: " . PopularPharmacy::count() . "\n";
} else {
    echo "\n⚠️  NENHUMA FARMÁCIA FOI IMPORTADA!\n";
    echo "Verifique o formato do arquivo e tente novamente.\n";
}

