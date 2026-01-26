<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Verificar se a tabela documents existe
        if (!Schema::hasTable('documents')) {
            return; // Se não existir, não fazer nada
        }
        
        Schema::table('documents', function (Blueprint $table) {
            // Verificar se a coluna doctor_id existe e tem foreign key
            if (Schema::hasColumn('documents', 'doctor_id')) {
                // Remover foreign key se existir
                try {
                    // Tentar remover a foreign key (nome pode variar)
                    $foreignKeys = DB::select("
                        SELECT CONSTRAINT_NAME 
                        FROM information_schema.KEY_COLUMN_USAGE 
                        WHERE TABLE_SCHEMA = DATABASE() 
                        AND TABLE_NAME = 'documents' 
                        AND COLUMN_NAME = 'doctor_id' 
                        AND REFERENCED_TABLE_NAME IS NOT NULL
                    ");
                    
                    foreach ($foreignKeys as $fk) {
                        $table->dropForeign([$fk->CONSTRAINT_NAME]);
                    }
                } catch (\Exception $e) {
                    // Se falhar, tentar remover com nome padrão
                    try {
                        $table->dropForeign(['documents_doctor_id_foreign']);
                    } catch (\Exception $e2) {
                        // Ignorar se não existir
                    }
                }
                
                // Alterar coluna para unsignedBigInteger (sem foreign key)
                // Isso permite que doctor_id aponte para doctors OU users
                DB::statement('ALTER TABLE documents MODIFY doctor_id BIGINT UNSIGNED NULL');
            } else {
                // Se a coluna não existir, criar como unsignedBigInteger
                $table->unsignedBigInteger('doctor_id')->nullable()->after('user_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Verificar se a tabela documents existe
        if (!Schema::hasTable('documents')) {
            return; // Se não existir, não fazer nada
        }
        
        Schema::table('documents', function (Blueprint $table) {
            if (Schema::hasColumn('documents', 'doctor_id')) {
                // Remover coluna temporariamente para recriar com foreign key
                // Mas isso pode causar perda de dados, então vamos apenas recriar a foreign key
                // Nota: Isso pode falhar se houver IDs que não existem em doctors
                try {
                    // Tentar recriar foreign key para doctors
                    // Mas isso pode falhar se houver doctor_id que aponta para users
                    // Por isso, vamos apenas alterar o tipo de volta
                    DB::statement('ALTER TABLE documents MODIFY doctor_id BIGINT UNSIGNED NULL');
                    
                    // Tentar adicionar foreign key (pode falhar se houver dados inválidos)
                    try {
                        $table->foreign('doctor_id')->references('id')->on('doctors')->onDelete('set null');
                    } catch (\Exception $e) {
                        // Se falhar, não fazer nada (pode haver dados que apontam para users)
                    }
                } catch (\Exception $e) {
                    // Ignorar erro
                }
            }
        });
    }
};
