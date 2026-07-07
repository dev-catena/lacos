<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Altera birth_weight de decimal(6,3) para decimal(7,2)
        // Motivo: decimal(6,3) suporta até 999.999, mas o peso em gramas (ex: 3250g) excede este limite.
        // decimal(7,2) suporta até 99999.99, cobrindo tanto gramas quanto kg.
        if (Schema::hasColumn('groups', 'birth_weight')) {
            DB::statement('ALTER TABLE groups MODIFY COLUMN birth_weight DECIMAL(7,2) NULL');
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('groups', 'birth_weight')) {
            DB::statement('ALTER TABLE groups MODIFY COLUMN birth_weight DECIMAL(6,3) NULL');
        }
    }
};
