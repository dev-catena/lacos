<?php
$file = '/var/www/lacos-backend/app/Http/Controllers/Api/GroupController.php';
$content = file_get_contents($file);

// Substituir o return response()->json($group); no método update
$oldReturn = 'return response()->json($group);';
$newReturn = '// Recarregar o grupo para garantir que temos os dados atualizados
        $group->refresh();

        // Garantir que photo_url está incluído na resposta
        $response = $group->toArray();
        if (!isset($response["photo_url"]) && $group->photo) {
            $response["photo_url"] = url("storage/" . $group->photo);
        }

        return response()->json($response);';

if (strpos($content, $oldReturn) !== false) {
    $content = str_replace($oldReturn, $newReturn, $content);
    file_put_contents($file, $content);
    echo "✅ Método update atualizado com sucesso\n";
} else {
    echo "⚠️ Padrão não encontrado. Verificando se já foi atualizado...\n";
    if (strpos($content, '$group->refresh()') !== false) {
        echo "✅ Método já está atualizado\n";
    } else {
        echo "❌ Não foi possível atualizar automaticamente\n";
    }
}







