<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('medication_catalog', function (Blueprint $table) {
            $table->string('obm_entity', 10)->nullable()->after('search_keywords');
            $table->string('obm_code', 40)->nullable()->after('obm_entity');
            $table->timestamp('obm_imported_at')->nullable()->after('obm_code');

            $table->unique(['obm_entity', 'obm_code'], 'medication_catalog_obm_unique');
        });
    }

    public function down(): void
    {
        Schema::table('medication_catalog', function (Blueprint $table) {
            $table->dropUnique('medication_catalog_obm_unique');
            $table->dropColumn(['obm_entity', 'obm_code', 'obm_imported_at']);
        });
    }
};
