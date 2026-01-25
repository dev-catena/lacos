<?php
$file = '/var/www/lacos-backend/app/Http/Controllers/Api/GroupController.php';
$content = file_get_contents($file);

// Encontrar o método show e corrigir
// O problema está no método show, não no update
$pattern = '/public function show\(\$id\)\s*\{[^}]*findOrFail\(\$id\);\s*(.*?)\s*return response\(\)->json\([^)]+\);/s';

// Primeiro, vamos encontrar e corrigir o método show manualmente
// Procurar por "public function show" até encontrar o próximo método ou o final da classe
$lines = explode("\n", $content);
$fixedLines = [];
$inShowMethod = false;
$showMethodFixed = false;
$braceCount = 0;

for ($i = 0; $i < count($lines); $i++) {
    $line = $lines[$i];
    
    // Detectar início do método show
    if (preg_match('/public function show\(/', $line)) {
        $inShowMethod = true;
        $braceCount = substr_count($line, '{') - substr_count($line, '}');
        $fixedLines[] = $line;
        continue;
    }
    
    // Se estamos no método show
    if ($inShowMethod) {
        $braceCount += substr_count($line, '{') - substr_count($line, '}');
        
        // Se encontramos código duplicado, pular
        if (preg_match('/Recarregar o grupo para garantir que temos os dados atualizados/', $line) && $showMethodFixed) {
            // Pular linhas duplicadas até encontrar return ou próximo método
            while ($i < count($lines) - 1 && !preg_match('/return response\(\)->json\(/', $lines[$i]) && !preg_match('/public function/', $lines[$i])) {
                $i++;
                $braceCount += substr_count($lines[$i], '{') - substr_count($lines[$i], '}');
            }
            // Voltar uma linha para processar o return
            $i--;
            continue;
        }
        
        // Se encontramos o código correto pela primeira vez, marcar
        if (preg_match('/Recarregar o grupo para garantir que temos os dados atualizados/', $line)) {
            $showMethodFixed = true;
        }
        
        // Se encontramos um if mal formado, corrigir
        if (preg_match('/if \(!isset\(\$response\["photo_url"\]\)\s*\/\/ Recarregar/', $line)) {
            $fixedLines[] = '        if (!isset($response["photo_url"]) && $group->photo) {';
            continue;
        }
        
        // Se encontramos return duplicado, pular
        if (preg_match('/return response\(\)->json\(\$response\);.*Recarregar/', $line)) {
            $fixedLines[] = '        return response()->json($response);';
            // Verificar se o método terminou
            if ($braceCount <= 0) {
                $inShowMethod = false;
                $showMethodFixed = false;
            }
            continue;
        }
        
        $fixedLines[] = $line;
        
        // Se o método terminou
        if ($braceCount <= 0 && $inShowMethod) {
            $inShowMethod = false;
            $showMethodFixed = false;
        }
    } else {
        $fixedLines[] = $line;
    }
}

$newContent = implode("\n", $fixedLines);
file_put_contents($file, $newContent);

// Verificar sintaxe
$output = [];
$returnCode = 0;
exec("php -l $file 2>&1", $output, $returnCode);

if ($returnCode === 0) {
    echo "✅ Arquivo corrigido com sucesso!\n";
} else {
    echo "❌ Ainda há erros de sintaxe:\n";
    echo implode("\n", $output) . "\n";
    // Restaurar backup
    if (file_exists($file . '.backup2')) {
        copy($file . '.backup2', $file);
        echo "⚠️ Backup restaurado\n";
    }
}







