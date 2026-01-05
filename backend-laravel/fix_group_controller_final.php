<?php
$file = '/var/www/lacos-backend/app/Http/Controllers/Api/GroupController.php';
$content = file_get_contents($file);

// Encontrar e remover chaves duplicadas após return response()->json($response);
$pattern = '/return response\(\)->json\(\$response\);\s*\}\s*\}\s*\}\s*\/\*\*/s';
$replacement = 'return response()->json($response);
    }

    /**
';

$content = preg_replace($pattern, $replacement, $content);

// Se ainda houver chaves duplicadas, remover manualmente
$lines = explode("\n", $content);
$fixedLines = [];
$foundReturn = false;
$braceCount = 0;

for ($i = 0; $i < count($lines); $i++) {
    $line = $lines[$i];
    
    // Detectar quando encontramos o return do método update
    if (strpos($line, 'return response()->json($response);') !== false) {
        $foundReturn = true;
        $fixedLines[] = $line;
        continue;
    }
    
    // Se encontramos o return, contar chaves
    if ($foundReturn) {
        $braceCount += substr_count($line, '}') - substr_count($line, '{');
        
        // Se encontramos uma chave de fechamento e já temos uma, pular duplicatas
        if (trim($line) === '}' && $braceCount > 0) {
            // Se já adicionamos uma chave, pular esta
            if (end($fixedLines) === '    }') {
                continue;
            }
        }
        
        $fixedLines[] = $line;
        
        // Se fechamos o método (braceCount >= 0 após encontrar return), resetar
        if ($braceCount >= 0 && trim($line) === '}') {
            $foundReturn = false;
            $braceCount = 0;
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
    echo "❌ Ainda há erros:\n";
    echo implode("\n", $output) . "\n";
    
    // Tentar correção mais simples: remover todas as chaves duplicadas após return
    $content = file_get_contents($file);
    $content = preg_replace('/return response\(\)->json\(\$response\);\s*\}\s*\}\s*\}\s*/', "return response()->json(\$response);\n    }\n\n", $content);
    file_put_contents($file, $content);
    
    exec("php -l $file 2>&1", $output, $returnCode);
    if ($returnCode === 0) {
        echo "✅ Corrigido com método alternativo!\n";
    } else {
        echo "❌ Erro persistente:\n";
        echo implode("\n", $output) . "\n";
    }
}







