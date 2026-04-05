<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'consultation_price')) {
                $table->decimal('consultation_price', 10, 2)->nullable()->after('hourly_rate');
            }
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'consultation_price')) {
                $table->dropColumn('consultation_price');
            }
        });
    }
};
