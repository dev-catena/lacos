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

        Schema::table('group_v8_ble_pairings', function (Blueprint $table) {
            if (! Schema::hasColumn('group_v8_ble_pairings', 'bracelet_model')) {
                $table->string('bracelet_model', 8)->default('v8')->after('bracelet_name');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('group_v8_ble_pairings')) {
            return;
        }

        Schema::table('group_v8_ble_pairings', function (Blueprint $table) {
            if (Schema::hasColumn('group_v8_ble_pairings', 'bracelet_model')) {
                $table->dropColumn('bracelet_model');
            }
        });
    }
};
