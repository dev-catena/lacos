<?php
$file = '/var/www/lacos-backend/app/Http/Controllers/Api/GroupController.php';
$content = file_get_contents($file);

// Encontrar o método update e substituir apenas o return
// Procurar por: $group->update($data); seguido de return response()->json($group);

$oldPattern = '/\$group->update\(\$data\);\s*return response\(\)->json\(\$group\);/s';
$newCode = '$group->update($data);
        
        // Recarregar o grupo para garantir que temos os dados atualizados
        $group->refresh();

        // Garantir que photo_url está incluído na resposta
        $response = $group->toArray();
        if (!isset($response["photo_url"]) && $group->photo) {
            $response["photo_url"] = url("storage/" . $group->photo);
        }

        return response()->json($response);';

if (preg_match($oldPattern, $content)) {
    $content = preg_replace($oldPattern, $newCode, $content);
    file_put_contents($file, $content);
    echo "✅ Método update corrigido com sucesso!\n";
    
    // Verificar sintaxe
    $output = [];
    $returnCode = 0;
    exec("php -l $file 2>&1", $output, $returnCode);
    
    if ($returnCode === 0) {
        echo "✅ Sintaxe PHP válida!\n";
    } else {
        echo "❌ Erro de sintaxe:\n";
        echo implode("\n", $output) . "\n";
    }
} else {
    echo "⚠️ Padrão não encontrado. Verificando se já foi corrigido...\n";
    if (strpos($content, '$group->refresh()') !== false && strpos($content, 'photo_url') !== false) {
        echo "✅ Método já parece estar corrigido.\n";
    } else {
        echo "❌ Não foi possível encontrar o padrão para substituir.\n";
        echo "Procurando por 'update(\$data)'...\n";
        if (preg_match('/update\(\$data\);[^}]*return/s', $content, $matches)) {
            echo "Encontrado:\n" . substr($matches[0], 0, 200) . "...\n";
        }
    }
}






