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
        Schema::table('medications', function (Blueprint $table) {
            if (!Schema::hasColumn('medications', 'instructions')) {
                $table->text('instructions')->nullable()->after('end_date');
            }
            if (!Schema::hasColumn('medications', 'registered_by_user_id')) {
                $table->foreignId('registered_by_user_id')->nullable()->after('is_active')
                    ->constrained('users')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('medications', function (Blueprint $table) {
            if (Schema::hasColumn('medications', 'instructions')) {
                $table->dropColumn('instructions');
            }
            if (Schema::hasColumn('medications', 'registered_by_user_id')) {
                $table->dropForeign(['registered_by_user_id']);
                $table->dropColumn('registered_by_user_id');
            }
        });
    }
};
