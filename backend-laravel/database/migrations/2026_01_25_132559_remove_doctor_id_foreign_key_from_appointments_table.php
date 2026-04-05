<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Verificar se a tabela appointments existe
        if (!Schema::hasTable('appointments')) {
            return; // Se não existir, não fazer nada
        }
        
        Schema::table('appointments', function (Blueprint $table) {
            // Verificar se a coluna doctor_id existe e tem foreign key
            if (Schema::hasColumn('appointments', 'doctor_id')) {
                // Remover foreign key se existir usando SQL direto
                try {
                    // Buscar o nome real da foreign key
                    $foreignKeys = DB::select("
                        SELECT CONSTRAINT_NAME 
                        FROM information_schema.KEY_COLUMN_USAGE 
                        WHERE TABLE_SCHEMA = DATABASE() 
                        AND TABLE_NAME = 'appointments' 
                        AND COLUMN_NAME = 'doctor_id' 
                        AND REFERENCED_TABLE_NAME IS NOT NULL
                    ");
                    
                    if (!empty($foreignKeys)) {
                        foreach ($foreignKeys as $fk) {
                            try {
                                // Usar SQL direto para remover a foreign key
                                DB::statement("ALTER TABLE appointments DROP FOREIGN KEY `{$fk->CONSTRAINT_NAME}`");
                            } catch (\Exception $e) {
                                // Ignorar se não conseguir remover
                            }
                        }
                    }
                } catch (\Exception $e) {
                    // Se falhar, tentar remover com nome conhecido
                    try {
                        DB::statement("ALTER TABLE appointments DROP FOREIGN KEY `appointments_doctor_id_foreign`");
                    } catch (\Exception $e2) {
                        // Ignorar se não existir
                    }
                }
                
                // Alterar coluna para unsignedBigInteger (sem foreign key)
                // Isso permite que doctor_id aponte para doctors OU users
                DB::statement('ALTER TABLE appointments MODIFY doctor_id BIGINT UNSIGNED NULL');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Verificar se a tabela appointments existe
        if (!Schema::hasTable('appointments')) {
            return; // Se não existir, não fazer nada
        }
        
        Schema::table('appointments', function (Blueprint $table) {
            if (Schema::hasColumn('appointments', 'doctor_id')) {
                // Alterar o tipo de volta
                DB::statement('ALTER TABLE appointments MODIFY doctor_id BIGINT UNSIGNED NULL');
                
                // Tentar adicionar foreign key (pode falhar se houver dados inválidos)
                try {
                    $table->foreign('doctor_id')->references('id')->on('doctors')->onDelete('set null');
                } catch (\Exception $e) {
                    // Se falhar, não fazer nada (pode haver dados que apontam para users)
                }
            }
        });
    }
};
