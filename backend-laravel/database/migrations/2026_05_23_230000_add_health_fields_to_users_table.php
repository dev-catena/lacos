<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'blood_type')) {
                $table->string('blood_type', 10)->nullable()->after('gender');
            }
            if (! Schema::hasColumn('users', 'chronic_diseases')) {
                $table->text('chronic_diseases')->nullable()->after('blood_type');
            }
            if (! Schema::hasColumn('users', 'allergies')) {
                $table->text('allergies')->nullable()->after('chronic_diseases');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $columns = ['blood_type', 'chronic_diseases', 'allergies'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
