#!/usr/bin/env php
<?php
/**
 * Script para corrigir erro de sintaxe em routes/api.php
 * 
 * O erro está na linha 84 onde há "/ Doctors & Medical" 
 * ao invés de "// Doctors & Medical"
 */

$routesFile = '/var/www/lacos-backend/routes/api.php';

if (!file_exists($routesFile)) {
    echo "❌ Arquivo não encontrado: $routesFile\n";
    exit(1);
}

// Ler o arquivo
$content = file_get_contents($routesFile);

// Substituir o comentário incorreto
// Procurar por "/ Doctors" ou "/ Doctors & Medical" e substituir por "// Doctors & Medical"
$content = preg_replace(
    '/^\s*\/\s+Doctors\s+&\s+Medical\s*$/m',
    '    // Doctors & Medical',
    $content
);

// Também verificar outros padrões possíveis
$content = preg_replace(
    '/^\s*\/\s+([A-Z])/m',
    '    // $1',
    $content
);

// Salvar o arquivo
if (file_put_contents($routesFile, $content)) {
    echo "✅ Arquivo corrigido com sucesso!\n";
    
    // Verificar sintaxe PHP
    $output = [];
    $returnVar = 0;
    exec("php -l $routesFile 2>&1", $output, $returnVar);
    
    if ($returnVar === 0) {
        echo "✅ Sintaxe PHP válida!\n";
    } else {
        echo "⚠️ Aviso: Verifique a sintaxe manualmente\n";
        echo implode("\n", $output) . "\n";
    }
} else {
    echo "❌ Erro ao salvar arquivo\n";
    exit(1);
}

