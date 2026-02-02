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
        // Usar SQL direto para garantir que a coluna tenha valor padrão e não permita NULL
        if (Schema::hasColumn('appointments', 'recurrence_type')) {
            // Atualizar registros existentes com NULL para 'none'
            DB::statement("UPDATE appointments SET recurrence_type = 'none' WHERE recurrence_type IS NULL");
            
            // Alterar a coluna para não permitir NULL e ter valor padrão 'none'
            DB::statement("ALTER TABLE appointments MODIFY COLUMN recurrence_type ENUM('none', 'daily', 'weekdays', 'custom') NOT NULL DEFAULT 'none'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('appointments', 'recurrence_type')) {
            // Reverter para nullable
            DB::statement("ALTER TABLE appointments MODIFY COLUMN recurrence_type ENUM('none', 'daily', 'weekdays', 'custom') NULL");
        }
    }
};
