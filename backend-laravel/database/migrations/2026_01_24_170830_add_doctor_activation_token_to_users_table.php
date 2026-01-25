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
            // Determinar a última coluna existente
            $lastColumn = 'doctor_approved_at';
            if (!Schema::hasColumn('users', 'doctor_approved_at')) {
                // Se doctor_approved_at não existe, tentar outros
                if (Schema::hasColumn('users', 'crm')) {
                    $lastColumn = 'crm';
                } elseif (Schema::hasColumn('users', 'profile')) {
                    $lastColumn = 'profile';
                } else {
                    $lastColumn = 'updated_at';
                }
            }
            
            if (!Schema::hasColumn('users', 'doctor_activation_token')) {
                $table->string('doctor_activation_token', 64)->nullable()->after($lastColumn);
                $lastColumn = 'doctor_activation_token';
            }
            
            if (!Schema::hasColumn('users', 'doctor_activation_token_expires_at')) {
                $table->timestamp('doctor_activation_token_expires_at')->nullable()->after($lastColumn);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'doctor_activation_token_expires_at')) {
                $table->dropColumn('doctor_activation_token_expires_at');
            }
            if (Schema::hasColumn('users', 'doctor_activation_token')) {
                $table->dropColumn('doctor_activation_token');
            }
        });
    }
};
