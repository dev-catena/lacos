<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            if (!Schema::hasColumn('groups', 'accompanied_birth_date')) {
                $table->date('accompanied_birth_date')->nullable()->after('accompanied_age');
            }
        });
    }

    public function down(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            if (Schema::hasColumn('groups', 'accompanied_birth_date')) {
                $table->dropColumn('accompanied_birth_date');
            }
        });
    }
};
