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
        Schema::table('appointments', function (Blueprint $table) {
            if (Schema::hasColumn('appointments', 'recurrence_type')) {
                // Atualizar registros existentes com recurrence_type null para 'none'
                DB::table('appointments')
                    ->whereNull('recurrence_type')
                    ->update(['recurrence_type' => 'none']);

                // Alterar a coluna para ter valor padrão 'none'
                $table->enum('recurrence_type', ['none', 'daily', 'weekdays', 'custom'])
                    ->default('none')
                    ->change();
            } else {
                // Se a coluna não existe, criar com valor padrão
                $table->enum('recurrence_type', ['none', 'daily', 'weekdays', 'custom'])
                    ->default('none')
                    ->after('notes');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            if (Schema::hasColumn('appointments', 'recurrence_type')) {
                $table->enum('recurrence_type', ['none', 'daily', 'weekdays', 'custom'])
                    ->nullable()
                    ->change();
            }
        });
    }
};
