<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * AMP usa DS_DESCR até 700 caracteres; nome_produto era 500.
     */
    public function up(): void
    {
        Schema::table('medication_catalog', function (Blueprint $table) {
            $table->string('nome_produto', 700)->change();
        });
    }

    public function down(): void
    {
        Schema::table('medication_catalog', function (Blueprint $table) {
            $table->string('nome_produto', 500)->change();
        });
    }
};
