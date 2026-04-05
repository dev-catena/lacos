<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adiciona roles usados pelo app: caregiver, health_professional, priority_contact, patient
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE group_members MODIFY COLUMN role ENUM(
            'admin',
            'member',
            'viewer',
            'caregiver',
            'health_professional',
            'priority_contact',
            'patient'
        ) DEFAULT 'member'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE group_members MODIFY COLUMN role ENUM(
            'admin',
            'member',
            'viewer'
        ) DEFAULT 'member'");
    }
};
