<?php

/**
 * Script para comparar routes/api.php do servidor com o local
 * e adicionar rotas faltantes
 */

$apiLocal = '/home/darley/lacos/backend-laravel/routes/api.php';
$apiServidor = '/tmp/api_servidor.php';

if (!file_exists($apiServidor)) {
    echo "❌ Arquivo do servidor não encontrado: $apiServidor\n";
    echo "Por favor, baixe o arquivo primeiro:\n";
    echo "  scp -P 63022 darley@10.102.0.103:/var/www/lacos-backend/routes/api.php $apiServidor\n";
    exit(1);
}

if (!file_exists($apiLocal)) {
    echo "❌ Arquivo local não encontrado: $apiLocal\n";
    exit(1);
}

// Ler arquivos
$conteudoLocal = file_get_contents($apiLocal);
$conteudoServidor = file_get_contents($apiServidor);

// Extrair rotas usando regex
function extrairRotas($conteudo) {
    $rotas = [];
    
    // Padrões para diferentes tipos de rotas
    $padroes = [
        // Route::get/post/put/delete/patch
        '/Route::(get|post|put|delete|patch)\([\'"]([^\'"]+)[\'"],\s*\[([^\]]+)\]/',
        // Route::apiResource
        '/Route::apiResource\([\'"]([^\'"]+)[\'"],\s*([^\)]+)\)/',
        // Route::resource
        '/Route::resource\([\'"]([^\'"]+)[\'"],\s*([^\)]+)\)/',
    ];
    
    // Extrair rotas Route::method
    preg_match_all('/Route::(get|post|put|delete|patch)\([\'"]([^\'"]+)[\'"],\s*\[([^\]]+)\]/', $conteudo, $matches, PREG_SET_ORDER);
    foreach ($matches as $match) {
        $metodo = $match[1];
        $path = $match[2];
        $controller = trim($match[3]);
        $rotas[] = [
            'tipo' => 'method',
            'metodo' => $metodo,
            'path' => $path,
            'controller' => $controller,
            'linha' => $match[0]
        ];
    }
    
    // Extrair Route::apiResource
    preg_match_all('/Route::apiResource\([\'"]([^\'"]+)[\'"],\s*([^\)]+)\)/', $conteudo, $matches, PREG_SET_ORDER);
    foreach ($matches as $match) {
        $path = $match[1];
        $controller = trim($match[2]);
        $rotas[] = [
            'tipo' => 'apiResource',
            'path' => $path,
            'controller' => $controller,
            'linha' => $match[0]
        ];
    }
    
    return $rotas;
}

$rotasLocal = extrairRotas($conteudoLocal);
$rotasServidor = extrairRotas($conteudoServidor);

echo "📊 Estatísticas:\n";
echo "  Rotas locais: " . count($rotasLocal) . "\n";
echo "  Rotas servidor: " . count($rotasServidor) . "\n\n";

// Encontrar rotas faltantes
$rotasFaltantes = [];
foreach ($rotasServidor as $rotaServidor) {
    $encontrada = false;
    foreach ($rotasLocal as $rotaLocal) {
        if ($rotaServidor['path'] === $rotaLocal['path'] && 
            ($rotaServidor['metodo'] ?? '') === ($rotaLocal['metodo'] ?? '')) {
            $encontrada = true;
            break;
        }
    }
    if (!$encontrada) {
        $rotasFaltantes[] = $rotaServidor;
    }
}

echo "🔍 Rotas faltantes no arquivo local: " . count($rotasFaltantes) . "\n\n";

if (count($rotasFaltantes) > 0) {
    echo "📋 Rotas que precisam ser adicionadas:\n";
    foreach ($rotasFaltantes as $rota) {
        echo "  - {$rota['metodo'] ?? 'resource'} {$rota['path']} -> {$rota['controller']}\n";
    }
    
    // Criar backup
    $backup = $apiLocal . '.backup_' . date('Ymd_His');
    copy($apiLocal, $backup);
    echo "\n✅ Backup criado: $backup\n";
    
    // Adicionar rotas faltantes ao final do arquivo (antes do último })
    $linhas = file($apiLocal);
    $ultimaChave = array_key_last($linhas);
    
    // Encontrar a última linha com })
    $posicaoInsercao = $ultimaChave;
    for ($i = count($linhas) - 1; $i >= 0; $i--) {
        if (trim($linhas[$i]) === '});') {
            $posicaoInsercao = $i;
            break;
        }
    }
    
    // Preparar rotas para inserção
    $rotasParaAdicionar = "\n    // Rotas adicionadas do servidor em " . date('Y-m-d H:i:s') . "\n";
    foreach ($rotasFaltantes as $rota) {
        // Extrair a linha completa do servidor
        $linhaCompleta = $rota['linha'];
        // Adicionar indentação
        $rotasParaAdicionar .= "    " . $linhaCompleta . "\n";
    }
    
    // Inserir antes do último })
    array_splice($linhas, $posicaoInsercao, 0, $rotasParaAdicionar);
    
    // Salvar
    file_put_contents($apiLocal, implode('', $linhas));
    echo "✅ Rotas adicionadas ao arquivo local!\n";
} else {
    echo "✅ Todas as rotas já estão sincronizadas!\n";
}








