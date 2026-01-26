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
            if (!Schema::hasColumn('users', 'availability')) {
                // Tentar adicionar após is_available se existir, senão adicionar no final
                if (Schema::hasColumn('users', 'is_available')) {
                    $table->text('availability')->nullable()->after('is_available');
                } else {
                    $table->text('availability')->nullable();
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'availability')) {
                $table->dropColumn('availability');
            }
        });
    }
};
