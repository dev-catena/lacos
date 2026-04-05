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
        if (Schema::hasColumn('medications', 'accompanied_person_id')) {
            return;
        }

        Schema::table('medications', function (Blueprint $table) {
            $table->unsignedBigInteger('accompanied_person_id')->nullable()
                ->after('prescription_id');
            $table->foreign('accompanied_person_id')
                ->references('id')
                ->on('accompanied_people')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('medications', function (Blueprint $table) {
            $table->dropForeign(['accompanied_person_id']);
            $table->dropColumn('accompanied_person_id');
        });
    }
};
