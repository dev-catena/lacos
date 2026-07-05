<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            if (!Schema::hasColumn('groups', 'accompanied_name')) {
                $table->string('accompanied_name', 100)->nullable()->after('code');
            }
            if (!Schema::hasColumn('groups', 'accompanied_age')) {
                $table->integer('accompanied_age')->nullable()->after('accompanied_name');
            }
            if (!Schema::hasColumn('groups', 'accompanied_gender')) {
                $table->enum('accompanied_gender', ['male', 'female', 'other'])->nullable()->after('accompanied_age');
            }
            if (!Schema::hasColumn('groups', 'accompanied_photo')) {
                $table->string('accompanied_photo')->nullable()->after('accompanied_gender');
            }
            if (!Schema::hasColumn('groups', 'health_info')) {
                $table->json('health_info')->nullable()->after('accompanied_photo');
            }
        });
    }

    public function down(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $columns = ['accompanied_name', 'accompanied_age', 'accompanied_gender', 'accompanied_photo', 'health_info'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('groups', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
