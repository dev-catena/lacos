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
        Schema::table('medications', function (Blueprint $table) {
            if (!Schema::hasColumn('medications', 'prescription_id')) {
                $table->foreignId('prescription_id')->nullable()->after('group_id')->constrained('prescriptions')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('medications', function (Blueprint $table) {
            if (Schema::hasColumn('medications', 'prescription_id')) {
                $table->dropForeign(['prescription_id']);
                $table->dropColumn('prescription_id');
            }
        });
    }
};
