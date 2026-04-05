<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pessoa acompanhada não deve permanecer como contato de emergência (dados legados).
     */
    public function up(): void
    {
        if (!Schema::hasTable('group_members') || !Schema::hasColumn('group_members', 'is_emergency_contact')) {
            return;
        }

        DB::table('group_members')
            ->whereIn('role', ['patient', 'priority_contact', 'accompanied'])
            ->where('is_emergency_contact', true)
            ->update(['is_emergency_contact' => false, 'updated_at' => now()]);
    }

    public function down(): void
    {
        // Irreversível: não restauramos flags antigas incorretas.
    }
};
