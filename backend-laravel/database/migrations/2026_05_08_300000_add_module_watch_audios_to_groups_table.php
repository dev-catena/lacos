<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            if (! Schema::hasColumn('groups', 'module_watch_audios')) {
                $table->boolean('module_watch_audios')->default(false)->after('accompanied_access_chat');
            }
        });
    }

    public function down(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            if (Schema::hasColumn('groups', 'module_watch_audios')) {
                $table->dropColumn('module_watch_audios');
            }
        });
    }
};
