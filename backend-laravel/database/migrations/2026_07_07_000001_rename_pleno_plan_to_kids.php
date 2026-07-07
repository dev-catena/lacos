<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('plans')
            ->where('slug', 'pleno')
            ->update([
                'name'       => 'Kids',
                'slug'       => 'kids',
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        DB::table('plans')
            ->where('slug', 'kids')
            ->update([
                'name'       => 'Pleno',
                'slug'       => 'pleno',
                'updated_at' => now(),
            ]);
    }
};
