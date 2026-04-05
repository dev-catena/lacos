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
        if (Schema::hasTable('group_messages')) {
            Schema::table('group_messages', function (Blueprint $table) {
                // Adicionar type se não existir
                if (!Schema::hasColumn('group_messages', 'type')) {
                    $table->enum('type', ['text', 'image'])->default('text')->after('content');
                }
                
                // Adicionar image_url se não existir
                if (!Schema::hasColumn('group_messages', 'image_url')) {
                    $table->string('image_url')->nullable()->after('type');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('group_messages')) {
            Schema::table('group_messages', function (Blueprint $table) {
                if (Schema::hasColumn('group_messages', 'image_url')) {
                    $table->dropColumn('image_url');
                }
                if (Schema::hasColumn('group_messages', 'type')) {
                    $table->dropColumn('type');
                }
            });
        }
    }
};
