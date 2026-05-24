<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('appointments', 'reminder_times')) {
            Schema::table('appointments', function (Blueprint $table) {
                $table->json('reminder_times')->nullable()->after('recurrence_end');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('appointments', 'reminder_times')) {
            Schema::table('appointments', function (Blueprint $table) {
                $table->dropColumn('reminder_times');
            });
        }
    }
};
