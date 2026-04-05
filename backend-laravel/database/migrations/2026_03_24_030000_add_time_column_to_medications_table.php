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
        if (Schema::hasColumn('medications', 'time')) {
            return;
        }

        Schema::table('medications', function (Blueprint $table) {
            $table->string('time', 20)->nullable()->after('frequency');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('medications', function (Blueprint $table) {
            if (Schema::hasColumn('medications', 'time')) {
                $table->dropColumn('time');
            }
        });
    }
};
