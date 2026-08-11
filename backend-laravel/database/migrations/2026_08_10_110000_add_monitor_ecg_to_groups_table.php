<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            if (!Schema::hasColumn('groups', 'monitor_ecg')) {
                $after = Schema::hasColumn('groups', 'monitor_sleep')
                    ? 'monitor_sleep'
                    : (Schema::hasColumn('groups', 'monitor_respiratory_rate')
                        ? 'monitor_respiratory_rate'
                        : 'is_active');
                $table->boolean('monitor_ecg')->default(false)->after($after);
            }
        });
    }

    public function down(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            if (Schema::hasColumn('groups', 'monitor_ecg')) {
                $table->dropColumn('monitor_ecg');
            }
        });
    }
};
