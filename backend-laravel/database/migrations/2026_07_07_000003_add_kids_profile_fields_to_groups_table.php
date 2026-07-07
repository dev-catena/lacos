<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            if (!Schema::hasColumn('groups', 'mother_name')) {
                $table->string('mother_name', 150)->nullable()->after('accompanied_birth_date');
            }
            if (!Schema::hasColumn('groups', 'birth_time')) {
                $table->time('birth_time')->nullable()->after('mother_name');
            }
            if (!Schema::hasColumn('groups', 'birth_weight')) {
                $table->decimal('birth_weight', 6, 3)->nullable()->after('birth_time');
            }
            if (!Schema::hasColumn('groups', 'birth_height')) {
                $table->decimal('birth_height', 5, 2)->nullable()->after('birth_weight');
            }
            if (!Schema::hasColumn('groups', 'blood_type')) {
                $table->string('blood_type', 10)->nullable()->after('birth_height');
            }
            if (!Schema::hasColumn('groups', 'allergies')) {
                $table->text('allergies')->nullable()->after('blood_type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $columns = ['mother_name', 'birth_time', 'birth_weight', 'birth_height', 'blood_type', 'allergies'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('groups', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
