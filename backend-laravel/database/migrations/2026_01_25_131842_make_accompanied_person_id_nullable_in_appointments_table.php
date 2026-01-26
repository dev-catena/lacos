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
            // Tornar accompanied_person_id nullable se existir
            if (Schema::hasColumn('appointments', 'accompanied_person_id')) {
                $table->unsignedBigInteger('accompanied_person_id')->nullable()->change();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Reverter para NOT NULL se necessário (pode causar erro se houver NULLs)
            if (Schema::hasColumn('appointments', 'accompanied_person_id')) {
                // Primeiro preencher NULLs com um valor padrão (ex: 1)
                DB::table('appointments')
                    ->whereNull('accompanied_person_id')
                    ->update(['accompanied_person_id' => 1]);
                
                $table->unsignedBigInteger('accompanied_person_id')->nullable(false)->change();
            }
        });
    }
};
