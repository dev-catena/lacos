<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('panic_events')) {
            return;
        }

        Schema::table('panic_events', function (Blueprint $table) {
            if (! Schema::hasColumn('panic_events', 'device_imei')) {
                $table->string('device_imei', 32)->nullable()->after('trigger_type');
            }
            if (! Schema::hasColumn('panic_events', 'thalamus_alert_id')) {
                $table->unsignedBigInteger('thalamus_alert_id')->nullable()->after('device_imei');
                $table->index(['device_imei', 'thalamus_alert_id'], 'panic_events_watch_alert_idx');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('panic_events')) {
            return;
        }

        Schema::table('panic_events', function (Blueprint $table) {
            if (Schema::hasColumn('panic_events', 'thalamus_alert_id')) {
                $table->dropIndex('panic_events_watch_alert_idx');
                $table->dropColumn('thalamus_alert_id');
            }
            if (Schema::hasColumn('panic_events', 'device_imei')) {
                $table->dropColumn('device_imei');
            }
        });
    }
};
