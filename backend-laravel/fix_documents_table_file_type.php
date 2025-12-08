<?php

/**
 * Script para corrigir a coluna mime_type para file_type na tabela documents
 * Execute: php fix_documents_table_file_type.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

try {
    if (!Schema::hasTable('documents')) {
        echo "❌ Tabela 'documents' não existe.\n";
        exit(1);
    }

    // Verificar se já tem file_type
    if (Schema::hasColumn('documents', 'file_type')) {
        echo "✅ Coluna 'file_type' já existe na tabela 'documents'.\n";
        exit(0);
    }

    // Verificar se tem mime_type para renomear
    if (Schema::hasColumn('documents', 'mime_type')) {
        echo "🔄 Renomeando coluna 'mime_type' para 'file_type'...\n";
        DB::statement('ALTER TABLE documents CHANGE mime_type file_type VARCHAR(100)');
        echo "✅ Coluna renomeada com sucesso!\n";
    } else {
        // Se não tem nenhuma das duas, criar file_type
        echo "➕ Criando coluna 'file_type'...\n";
        DB::statement('ALTER TABLE documents ADD COLUMN file_type VARCHAR(100) AFTER file_name');
        echo "✅ Coluna criada com sucesso!\n";
    }

    echo "\n✅ Correção aplicada com sucesso!\n";
} catch (\Exception $e) {
    echo "❌ Erro: " . $e->getMessage() . "\n";
    exit(1);
}






