<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('devices', function (Blueprint $table) {
            if (!Schema::hasColumn('devices', 'thalamus_device_id')) {
                $table->unsignedBigInteger('thalamus_device_id')->nullable()->after('group_id');
            }
        });

        Schema::table('groups', function (Blueprint $table) {
            if (!Schema::hasColumn('groups', 'thalamus_group_external_id')) {
                $table->string('thalamus_group_external_id', 191)->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('devices', function (Blueprint $table) {
            if (Schema::hasColumn('devices', 'thalamus_device_id')) {
                $table->dropColumn('thalamus_device_id');
            }
        });

        Schema::table('groups', function (Blueprint $table) {
            if (Schema::hasColumn('groups', 'thalamus_group_external_id')) {
                $table->dropColumn('thalamus_group_external_id');
            }
        });
    }
};
