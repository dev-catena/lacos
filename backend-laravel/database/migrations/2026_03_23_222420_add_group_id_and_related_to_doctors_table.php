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
        Schema::table('doctors', function (Blueprint $table) {
            if (!Schema::hasColumn('doctors', 'group_id')) {
                $table->foreignId('group_id')->nullable()->after('id')->constrained('groups')->onDelete('cascade');
            }
            if (!Schema::hasColumn('doctors', 'is_primary')) {
                $table->boolean('is_primary')->default(false)->after('notes');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('doctors', function (Blueprint $table) {
            if (Schema::hasColumn('doctors', 'group_id')) {
                $table->dropForeign(['group_id']);
                $table->dropColumn('group_id');
            }
            if (Schema::hasColumn('doctors', 'is_primary')) {
                $table->dropColumn('is_primary');
            }
        });
    }
};
