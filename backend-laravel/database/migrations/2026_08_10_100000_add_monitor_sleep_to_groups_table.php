<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            if (!Schema::hasColumn('groups', 'monitor_sleep')) {
                $after = Schema::hasColumn('groups', 'monitor_respiratory_rate')
                    ? 'monitor_respiratory_rate'
                    : (Schema::hasColumn('groups', 'monitor_temperature')
                        ? 'monitor_temperature'
                        : 'is_active');
                $table->boolean('monitor_sleep')->default(false)->after($after);
            }
        });
    }

    public function down(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            if (Schema::hasColumn('groups', 'monitor_sleep')) {
                $table->dropColumn('monitor_sleep');
            }
        });
    }
};
