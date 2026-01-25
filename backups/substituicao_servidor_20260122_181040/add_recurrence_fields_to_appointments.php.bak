<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->string('recurrence_type', 20)->nullable()->after('notes');
            $table->text('recurrence_days')->nullable()->after('recurrence_type');
            $table->dateTime('recurrence_start')->nullable()->after('recurrence_days');
            $table->dateTime('recurrence_end')->nullable()->after('recurrence_start');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropColumn(['recurrence_type', 'recurrence_days', 'recurrence_start', 'recurrence_end']);
        });
    }
};

