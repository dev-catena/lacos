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
            $lastColumn = 'updated_at';
            if (Schema::hasColumn('users', 'is_blocked')) {
                $lastColumn = 'is_blocked';
            } elseif (Schema::hasColumn('users', 'profile')) {
                $lastColumn = 'profile';
            } elseif (Schema::hasColumn('users', 'email_verified_at')) {
                $lastColumn = 'email_verified_at';
            }
            
            if (!Schema::hasColumn('users', 'doctor_approved_at')) {
                $table->timestamp('doctor_approved_at')->nullable()->after($lastColumn);
                $lastColumn = 'doctor_approved_at';
            }
            if (!Schema::hasColumn('users', 'crm')) {
                $table->string('crm')->nullable()->after($lastColumn);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'doctor_approved_at')) {
                $table->dropColumn('doctor_approved_at');
            }
            if (Schema::hasColumn('users', 'crm')) {
                $table->dropColumn('crm');
            }
        });
    }
};

