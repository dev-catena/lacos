<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Adicionar coluna code se não existir
        if (!Schema::hasColumn('groups', 'code')) {
            Schema::table('groups', function (Blueprint $table) {
                $table->string('code', 20)->nullable()->unique()->after('description');
            });
        }

        // Gerar códigos para grupos existentes que não têm código
        $groupsWithoutCode = DB::table('groups')
            ->whereNull('code')
            ->orWhere('code', '')
            ->get();

        foreach ($groupsWithoutCode as $group) {
            // Gerar código único de 8 caracteres
            do {
                $code = strtoupper(substr(md5(uniqid(rand(), true)), 0, 8));
                $exists = DB::table('groups')->where('code', $code)->exists();
            } while ($exists);

            DB::table('groups')
                ->where('id', $group->id)
                ->update(['code' => $code]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('groups', 'code')) {
            Schema::table('groups', function (Blueprint $table) {
                $table->dropColumn('code');
            });
        }
    }
};
