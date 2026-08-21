<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('group_v8_ble_pairings')) {
            return;
        }
        if (! Schema::hasColumn('group_v8_ble_pairings', 'battery_percent')) {
            Schema::table('group_v8_ble_pairings', function (Blueprint $table) {
                $table->unsignedTinyInteger('battery_percent')->nullable()->after('bracelet_model');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('group_v8_ble_pairings') && Schema::hasColumn('group_v8_ble_pairings', 'battery_percent')) {
            Schema::table('group_v8_ble_pairings', function (Blueprint $table) {
                $table->dropColumn('battery_percent');
            });
        }
    }
};
