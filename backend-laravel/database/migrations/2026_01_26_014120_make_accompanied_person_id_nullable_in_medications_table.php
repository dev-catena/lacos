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
        Schema::table('medications', function (Blueprint $table) {
            // Tornar accompanied_person_id nullable para permitir medicamentos de receitas sem paciente específico
            $table->unsignedBigInteger('accompanied_person_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('medications', function (Blueprint $table) {
            // Reverter para NOT NULL (pode causar erro se houver registros com NULL)
            $table->unsignedBigInteger('accompanied_person_id')->nullable(false)->change();
        });
    }
};
