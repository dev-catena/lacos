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
        Schema::table('users', function (Blueprint $table) {
            // Adicionar medical_specialty_id se não existir
            if (!Schema::hasColumn('users', 'medical_specialty_id')) {
                $table->foreignId('medical_specialty_id')
                    ->nullable()
                    ->after('profile')
                    ->constrained('medical_specialties')
                    ->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'medical_specialty_id')) {
                $table->dropForeign(['medical_specialty_id']);
                $table->dropColumn('medical_specialty_id');
            }
        });
    }
};
