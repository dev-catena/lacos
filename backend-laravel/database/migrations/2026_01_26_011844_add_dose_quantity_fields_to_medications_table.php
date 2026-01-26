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
            // Verificar se pharmaceutical_form existe, se não, adicionar
            if (!Schema::hasColumn('medications', 'pharmaceutical_form')) {
                $table->string('pharmaceutical_form', 50)->nullable()->after('name');
            }
            // Verificar se unit existe, se não, adicionar
            if (!Schema::hasColumn('medications', 'unit')) {
                $table->string('unit', 20)->nullable()->after('dosage');
            }
            // Verificar se administration_route existe, se não, adicionar
            if (!Schema::hasColumn('medications', 'administration_route')) {
                // Adicionar após unit se existir, senão após dosage
                if (Schema::hasColumn('medications', 'unit')) {
                    $table->string('administration_route', 50)->nullable()->after('unit');
                } else {
                    $table->string('administration_route', 50)->nullable()->after('dosage');
                }
            }
            // Adicionar dose_quantity após administration_route (ou unit se administration_route não existir)
            if (!Schema::hasColumn('medications', 'dose_quantity')) {
                if (Schema::hasColumn('medications', 'administration_route')) {
                    $table->string('dose_quantity', 20)->nullable()->after('administration_route');
                } else if (Schema::hasColumn('medications', 'unit')) {
                    $table->string('dose_quantity', 20)->nullable()->after('unit');
                } else {
                    $table->string('dose_quantity', 20)->nullable()->after('dosage');
                }
            }
            // Adicionar dose_quantity_unit após dose_quantity
            if (!Schema::hasColumn('medications', 'dose_quantity_unit')) {
                $table->string('dose_quantity_unit', 20)->nullable()->after('dose_quantity');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('medications', function (Blueprint $table) {
            if (Schema::hasColumn('medications', 'dose_quantity')) {
                $table->dropColumn('dose_quantity');
            }
            if (Schema::hasColumn('medications', 'dose_quantity_unit')) {
                $table->dropColumn('dose_quantity_unit');
            }
        });
    }
};
