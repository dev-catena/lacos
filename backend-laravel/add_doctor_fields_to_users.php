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
            if (!Schema::hasColumn('users', 'doctor_approved_at')) {
                $table->timestamp('doctor_approved_at')->nullable()->after('is_blocked');
            }
            if (!Schema::hasColumn('users', 'crm')) {
                $table->string('crm')->nullable()->after('doctor_approved_at');
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

