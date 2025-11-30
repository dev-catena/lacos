<?php

// importador_farmacias_debug.php - Versão com debug

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use App\Models\PopularPharmacy;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Ler arquivo CSV
$csvFile = __DIR__ . '/farmacias_populares.csv';

echo "📁 Verificando arquivo: {$csvFile}\n";

if (!file_exists($csvFile)) {
    die("❌ Erro: Arquivo CSV não encontrado em: {$csvFile}\n");
}

$fileSize = filesize($csvFile);
echo "📊 Tamanho do arquivo: " . number_format($fileSize) . " bytes\n";

$handle = fopen($csvFile, 'r');

if ($handle === false) {
    die("❌ Erro ao abrir arquivo CSV\n");
}

// Detectar delimitador e encoding
$firstLine = fgets($handle);
rewind($handle);

echo "📝 Primeira linha do arquivo:\n";
echo "   " . substr($firstLine, 0, 200) . "\n";

// Tentar detectar delimitador
$delimiters = [',', ';', "\t"];
$delimiter = ',';
$maxCount = 0;

foreach ($delimiters as $d) {
    $count = substr_count($firstLine, $d);
    if ($count > $maxCount) {
        $maxCount = $count;
        $delimiter = $d;
    }
}

echo "🔍 Delimitador detectado: '" . ($delimiter === "\t" ? "TAB" : $delimiter) . "'\n";

// Ler cabeçalho
$header = fgetcsv($handle, 0, $delimiter);
echo "\n📋 Cabeçalho detectado (" . count($header) . " colunas):\n";
foreach ($header as $i => $col) {
    echo "   [$i] " . trim($col) . "\n";
}

// Verificar se há dados
$lineCount = 0;
$validCount = 0;
$skippedCount = 0;
$duplicateCount = 0;
$errorCount = 0;

echo "\n🔄 Iniciando importação...\n\n";

while (($data = fgetcsv($handle, 0, $delimiter)) !== false) {
    $lineCount++;
    
    // Pular linhas vazias
    if (empty(array_filter($data))) {
        continue;
    }
    
    // Debug: mostrar primeira linha de dados
    if ($lineCount === 1) {
        echo "📄 Primeira linha de dados (" . count($data) . " colunas):\n";
        foreach ($data as $i => $val) {
            echo "   [$i] " . substr(trim($val), 0, 50) . "\n";
        }
        echo "\n";
    }
    
    // Ajustar índices conforme a estrutura do CSV
    // Tentar diferentes formatos comuns
    $name = trim($data[0] ?? '');
    $address = trim($data[1] ?? '');
    $neighborhood = trim($data[2] ?? '');
    $city = trim($data[3] ?? '');
    $state = trim($data[4] ?? '');
    $zipCode = trim($data[5] ?? '');
    $phone = trim($data[6] ?? '');
    
    // Se não encontrou dados nos índices padrão, tentar outros formatos
    if (empty($name) && count($data) > 0) {
        // Talvez o formato seja diferente - tentar todos os campos
        foreach ($data as $i => $val) {
            $val = trim($val);
            if (empty($name) && strlen($val) > 5 && !preg_match('/^\d+$/', $val)) {
                $name = $val;
            }
            if (empty($city) && (stripos($val, 'MG') !== false || stripos($val, 'SP') !== false || stripos($val, 'RJ') !== false)) {
                // Pode ser cidade ou estado
            }
        }
    }
    
    // Validação
    if (empty($name) || empty($city) || empty($state)) {
        $skippedCount++;
        if ($lineCount <= 3) {
            echo "⚠️  Linha {$lineCount} pulada: name='{$name}', city='{$city}', state='{$state}'\n";
        }
        continue;
    }
    
    // Limitar estado a 2 caracteres
    $state = strtoupper(substr($state, 0, 2));
    
    // Verificar se já existe
    try {
        $exists = PopularPharmacy::where('name', $name)
            ->where('city', $city)
            ->where(function($query) use ($address) {
                if (!empty($address)) {
                    $query->where('address', $address);
                }
            })
            ->first();
        
        if ($exists) {
            $duplicateCount++;
            continue;
        }
        
        // Criar registro
        PopularPharmacy::create([
            'name' => $name,
            'address' => $address ?: null,
            'neighborhood' => $neighborhood ?: null,
            'city' => $city,
            'state' => $state,
            'zip_code' => $zipCode ?: null,
            'phone' => $phone ?: null,
            'latitude' => null,
            'longitude' => null,
            'is_active' => true,
        ]);
        
        $validCount++;
        
        if ($validCount <= 5) {
            echo "✅ Importada: {$name} - {$city}/{$state}\n";
        } elseif ($validCount % 100 === 0) {
            echo "✅ Importadas {$validCount} farmácias...\n";
        }
        
    } catch (\Exception $e) {
        $errorCount++;
        if ($errorCount <= 5) {
            echo "❌ Erro na linha {$lineCount}: " . $e->getMessage() . "\n";
        }
    }
}

fclose($handle);

echo "\n";
echo "═══════════════════════════════════════\n";
echo "📊 RESUMO DA IMPORTAÇÃO\n";
echo "═══════════════════════════════════════\n";
echo "Total de linhas processadas: {$lineCount}\n";
echo "✅ Farmácias importadas: {$validCount}\n";
echo "⚠️  Linhas puladas (inválidas): {$skippedCount}\n";
echo "🔄 Duplicatas ignoradas: {$duplicateCount}\n";
echo "❌ Erros: {$errorCount}\n";
echo "═══════════════════════════════════════\n";

if ($validCount === 0) {
    echo "\n⚠️  NENHUMA FARMÁCIA FOI IMPORTADA!\n";
    echo "Verifique:\n";
    echo "1. O formato do CSV (delimitador, encoding)\n";
    echo "2. Se o arquivo tem dados válidos\n";
    echo "3. Se os índices das colunas estão corretos\n";
    echo "4. Execute: head -10 farmacias_populares.csv\n";
}

