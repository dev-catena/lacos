<?php
$file = '/var/www/lacos-backend/app/Http/Controllers/Api/GroupController.php';
$content = file_get_contents($file);

// Encontrar e substituir o método update completo
$oldMethod = '/public function update\(Request \$request, \$id\)\s*\{.*?return response\(\)->json\(\$response\);\s*\}/s';

$newMethod = 'public function update(Request $request, $id)
    {
        $group = Group::findOrFail($id);

        $request->validate([
            \'name\' => \'sometimes|string|max:100\',
            \'description\' => \'sometimes|nullable|string\',
            \'accompanied_name\' => \'sometimes|string|max:100\',
            \'accompanied_age\' => \'sometimes|nullable|integer\',
            \'accompanied_gender\' => \'sometimes|nullable|in:male,female,other\',
            \'accompanied_photo\' => \'sometimes|nullable|string\',
            \'health_info\' => \'sometimes|nullable|array\',
            \'photo\' => \'sometimes|nullable|image|mimes:jpeg,png,jpg,gif|max:2048\',
        ]);

        $data = $request->only([
            \'name\',
            \'description\',
            \'accompanied_name\',
            \'accompanied_age\',
            \'accompanied_gender\',
            \'accompanied_photo\',
            \'health_info\',
        ]);

        // Handle photo upload
        if ($request->hasFile(\'photo\')) {
            \Log::info("📸 GroupController.update - Foto recebida: SIM");
            
            // Delete old photo if exists
            if ($group->photo && Storage::disk(\'public\')->exists($group->photo)) {
                Storage::disk(\'public\')->delete($group->photo);
            }
            
            // Store new photo
            $photo = $request->file(\'photo\');
            $photoPath = $photo->store(\'groups\', \'public\');
            $data[\'photo\'] = $photoPath;
            
            \Log::info("📸 GroupController.update - Foto salva em: " . $photoPath);
        } else {
            \Log::info("📸 GroupController.update - Foto recebida: NÃO");
        }

        $group->update($data);
        
        // Recarregar o grupo para garantir que temos os dados atualizados
        $group->refresh();

        // Garantir que photo_url está incluído na resposta
        $response = $group->toArray();
        if (!isset($response["photo_url"]) && $group->photo) {
            $response["photo_url"] = url("storage/" . $group->photo);
        }

        \Log::info("📸 GroupController.update - photo_url na resposta: " . ($response["photo_url"] ?? "NÃO"));
        
        return response()->json($response);
    }';

if (preg_match($oldMethod, $content)) {
    $content = preg_replace($oldMethod, $newMethod, $content);
    file_put_contents($file, $content);
    echo "✅ Método update substituído com sucesso!\n";
} else {
    // Tentar substituição mais simples - apenas corrigir os logs
    $content = str_replace('og::info', 'Log::info', $content);
    $content = str_replace('og::info', '\\Log::info', $content);
    
    // Corrigir logs específicos
    $content = preg_replace('/og::info\("📸 groupcontroller\.update - foto recebida: " \. \(\$request->hasfile\("photo"\) \? "sim" : "não"\)\);/', '\\Log::info("📸 GroupController.update - Foto recebida: " . ($request->hasFile("photo") ? "SIM" : "NÃO"));', $content);
    $content = preg_replace('/og::info\("📸 groupcontroller\.update - foto salva: " \. \(\$group->photo \?\? "não"\)\);/', '\\Log::info("📸 GroupController.update - Foto salva: " . ($group->photo ?? "NÃO"));', $content);
    
    file_put_contents($file, $content);
    echo "⚠️ Substituição simples aplicada (correção de logs)\n";
}

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






