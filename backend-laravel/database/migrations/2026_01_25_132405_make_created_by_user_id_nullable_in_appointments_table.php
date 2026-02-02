<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Tornar created_by_user_id nullable se existir
            if (Schema::hasColumn('appointments', 'created_by_user_id')) {
                $table->unsignedBigInteger('created_by_user_id')->nullable()->change();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Reverter para NOT NULL (pode causar erro se houver NULLs)
            if (Schema::hasColumn('appointments', 'created_by_user_id')) {
                // Primeiro preencher NULLs com um valor padrão (ex: 1) se necessário
                \DB::table('appointments')
                    ->whereNull('created_by_user_id')
                    ->update(['created_by_user_id' => 1]);
                
                $table->unsignedBigInteger('created_by_user_id')->nullable(false)->change();
            }
        });
    }
};
