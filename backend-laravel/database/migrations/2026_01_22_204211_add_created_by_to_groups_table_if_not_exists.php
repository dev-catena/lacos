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
        // Verificar se a coluna created_by já existe
        if (!Schema::hasColumn('groups', 'created_by')) {
            Schema::table('groups', function (Blueprint $table) {
                $table->foreignId('created_by')->nullable()->after('is_active')->constrained('users')->onDelete('cascade');
            });
        }

        // Atualizar grupos existentes: se têm admin_user_id mas não têm created_by, copiar admin_user_id para created_by
        if (Schema::hasColumn('groups', 'admin_user_id') && Schema::hasColumn('groups', 'created_by')) {
            DB::statement('UPDATE `groups` SET `created_by` = `admin_user_id` WHERE `created_by` IS NULL AND `admin_user_id` IS NOT NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('groups', 'created_by')) {
            Schema::table('groups', function (Blueprint $table) {
                $table->dropForeign(['created_by']);
                $table->dropColumn('created_by');
            });
        }
    }
};
