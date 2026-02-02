<?php

/**
 * Script para sincronizar routes/api.php do servidor com o local
 * Identifica rotas faltantes e rotas comentadas que devem ser ativadas
 */

$apiLocal = '/home/darley/lacos/backend-laravel/routes/api.php';
$apiServidor = '/tmp/api_servidor.php';

if (!file_exists($apiServidor)) {
    echo "❌ Arquivo do servidor não encontrado: $apiServidor\n\n";
    echo "📥 Por favor, baixe o arquivo primeiro:\n";
    echo "   scp -P 63022 darley@10.102.0.103:/var/www/lacos-backend/routes/api.php $apiServidor\n";
    echo "\n   Ou:\n";
    echo "   ssh -p 63022 darley@10.102.0.103 'cat /var/www/lacos-backend/routes/api.php' > $apiServidor\n";
    exit(1);
}

if (!file_exists($apiLocal)) {
    echo "❌ Arquivo local não encontrado: $apiLocal\n";
    exit(1);
}

// Ler arquivos
$conteudoLocal = file_get_contents($apiLocal);
$conteudoServidor = file_get_contents($apiServidor);
$linhasLocal = file($apiLocal);
$linhasServidor = file($apiServidor);

echo "📊 Analisando arquivos...\n";
echo "  Local: " . count($linhasLocal) . " linhas\n";
echo "  Servidor: " . count($linhasServidor) . " linhas\n\n";

// Função para normalizar rotas (remover espaços, comentários, etc)
function normalizarRota($linha) {
    $linha = trim($linha);
    // Remover comentários
    $linha = preg_replace('/\/\/.*$/', '', $linha);
    $linha = trim($linha);
    return $linha;
}

// Extrair todas as rotas ativas do servidor
$rotasServidor = [];
foreach ($linhasServidor as $num => $linha) {
    $linhaNormalizada = normalizarRota($linha);
    
    // Identificar rotas Route::method
    if (preg_match('/Route::(get|post|put|delete|patch)\([\'"]([^\'"]+)[\'"],\s*\[([^\]]+)\]/', $linhaNormalizada, $matches)) {
        $rotasServidor[] = [
            'tipo' => 'method',
            'metodo' => $matches[1],
            'path' => $matches[2],
            'controller' => trim($matches[3]),
            'linha_original' => $linha,
            'linha_normalizada' => $linhaNormalizada,
            'numero' => $num + 1
        ];
    }
    // Identificar Route::apiResource
    elseif (preg_match('/Route::apiResource\([\'"]([^\'"]+)[\'"],\s*([^\)]+)\)/', $linhaNormalizada, $matches)) {
        $rotasServidor[] = [
            'tipo' => 'apiResource',
            'path' => $matches[1],
            'controller' => trim($matches[2]),
            'linha_original' => $linha,
            'linha_normalizada' => $linhaNormalizada,
            'numero' => $num + 1
        ];
    }
}

// Extrair rotas do local (ativas e comentadas)
$rotasLocalAtivas = [];
$rotasLocalComentadas = [];
foreach ($linhasLocal as $num => $linha) {
    $linhaOriginal = $linha;
    $linhaNormalizada = normalizarRota($linha);
    $estaComentada = preg_match('/^\s*\/\//', $linha);
    
    // Identificar rotas Route::method
    if (preg_match('/Route::(get|post|put|delete|patch)\([\'"]([^\'"]+)[\'"],\s*\[([^\]]+)\]/', $linhaNormalizada, $matches)) {
        $rota = [
            'tipo' => 'method',
            'metodo' => $matches[1],
            'path' => $matches[2],
            'controller' => trim($matches[3]),
            'linha_original' => $linhaOriginal,
            'linha_normalizada' => $linhaNormalizada,
            'numero' => $num + 1,
            'comentada' => $estaComentada
        ];
        
        if ($estaComentada) {
            $rotasLocalComentadas[] = $rota;
        } else {
            $rotasLocalAtivas[] = $rota;
        }
    }
    // Identificar Route::apiResource
    elseif (preg_match('/Route::apiResource\([\'"]([^\'"]+)[\'"],\s*([^\)]+)\)/', $linhaNormalizada, $matches)) {
        $rota = [
            'tipo' => 'apiResource',
            'path' => $matches[1],
            'controller' => trim($matches[2]),
            'linha_original' => $linhaOriginal,
            'linha_normalizada' => $linhaNormalizada,
            'numero' => $num + 1,
            'comentada' => $estaComentada
        ];
        
        if ($estaComentada) {
            $rotasLocalComentadas[] = $rota;
        } else {
            $rotasLocalAtivas[] = $rota;
        }
    }
}

echo "📋 Estatísticas:\n";
echo "  Rotas ativas no servidor: " . count($rotasServidor) . "\n";
echo "  Rotas ativas no local: " . count($rotasLocalAtivas) . "\n";
echo "  Rotas comentadas no local: " . count($rotasLocalComentadas) . "\n\n";

// Encontrar rotas faltantes
$rotasFaltantes = [];
$rotasParaDescomentar = [];

foreach ($rotasServidor as $rotaServidor) {
    $encontrada = false;
    $encontradaComentada = false;
    $linhaLocal = null;
    
    // Verificar se existe ativa
    foreach ($rotasLocalAtivas as $rotaLocal) {
        $metodoServidor = isset($rotaServidor['metodo']) ? $rotaServidor['metodo'] : '';
        $metodoLocal = isset($rotaLocal['metodo']) ? $rotaLocal['metodo'] : '';
        if ($rotaServidor['path'] === $rotaLocal['path'] && 
            $metodoServidor === $metodoLocal) {
            $encontrada = true;
            break;
        }
    }
    
    // Se não encontrada ativa, verificar se está comentada
    if (!$encontrada) {
        foreach ($rotasLocalComentadas as $rotaLocal) {
            $metodoServidor = isset($rotaServidor['metodo']) ? $rotaServidor['metodo'] : '';
            $metodoLocal = isset($rotaLocal['metodo']) ? $rotaLocal['metodo'] : '';
            if ($rotaServidor['path'] === $rotaLocal['path'] && 
                $metodoServidor === $metodoLocal) {
                $encontradaComentada = true;
                $linhaLocal = $rotaLocal;
                break;
            }
        }
    }
    
    if (!$encontrada && !$encontradaComentada) {
        $rotasFaltantes[] = $rotaServidor;
    } elseif ($encontradaComentada) {
        $rotasParaDescomentar[] = [
            'servidor' => $rotaServidor,
            'local' => $linhaLocal
        ];
    }
}

// Mostrar resultados
if (count($rotasParaDescomentar) > 0) {
    echo "🔓 Rotas comentadas que devem ser ativadas: " . count($rotasParaDescomentar) . "\n";
    foreach ($rotasParaDescomentar as $item) {
        $r = $item['servidor'];
        $metodo = isset($r['metodo']) ? $r['metodo'] : 'resource';
        echo "  - " . $metodo . " " . $r['path'] . " -> " . $r['controller'] . " (linha " . $item['local']['numero'] . ")\n";
    }
    echo "\n";
}

if (count($rotasFaltantes) > 0) {
    echo "➕ Rotas completamente faltantes: " . count($rotasFaltantes) . "\n";
    foreach ($rotasFaltantes as $r) {
        $metodo = isset($r['metodo']) ? $r['metodo'] : 'resource';
        echo "  - " . $metodo . " " . $r['path'] . " -> " . $r['controller'] . "\n";
    }
    echo "\n";
}

if (count($rotasParaDescomentar) == 0 && count($rotasFaltantes) == 0) {
    echo "✅ Todas as rotas já estão sincronizadas!\n";
    exit(0);
}

// Criar backup
$backup = $apiLocal . '.backup_' . date('Ymd_His');
copy($apiLocal, $backup);
echo "✅ Backup criado: $backup\n\n";

// Aplicar mudanças
$novoConteudo = $conteudoLocal;

// 1. Descomentar rotas
foreach ($rotasParaDescomentar as $item) {
    $linhaComentada = $item['local']['linha_original'];
    $linhaAtiva = preg_replace('/^\s*\/\/\s*/', '', $linhaComentada);
    $novoConteudo = str_replace($linhaComentada, $linhaAtiva, $novoConteudo);
    echo "✅ Descomentada: {$item['servidor']['path']}\n";
}

// 2. Adicionar rotas faltantes
if (count($rotasFaltantes) > 0) {
    // Encontrar a última linha antes do último })
    $ultimaPosicao = strrpos($novoConteudo, '});');
    if ($ultimaPosicao !== false) {
        $rotasParaAdicionar = "\n    // Rotas adicionadas do servidor em " . date('Y-m-d H:i:s') . "\n";
        foreach ($rotasFaltantes as $r) {
            $linha = $r['linha_original'];
            // Remover indentação original e adicionar indentação correta
            $linha = preg_replace('/^\s+/', '', $linha);
            $rotasParaAdicionar .= "    " . $linha;
        }
        $novoConteudo = substr_replace($novoConteudo, $rotasParaAdicionar . "\n", $ultimaPosicao, 0);
        echo "\n✅ Adicionadas " . count($rotasFaltantes) . " rotas faltantes\n";
    }
}

// Salvar
file_put_contents($apiLocal, $novoConteudo);
echo "\n✅ Arquivo atualizado com sucesso!\n";
echo "📝 Total de mudanças:\n";
echo "  - Rotas descomentadas: " . count($rotasParaDescomentar) . "\n";
echo "  - Rotas adicionadas: " . count($rotasFaltantes) . "\n";

