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
        Schema::table('vital_signs', function (Blueprint $table) {
            if (Schema::hasColumn('vital_signs', 'accompanied_person_id')) {
                // Tentar remover a foreign key se existir (pode falhar se não existir, mas não é crítico)
                try {
                    $table->dropForeign(['accompanied_person_id']);
                } catch (\Exception $e) {
                    // Foreign key pode não existir, continuar
                }
                // Alterar a coluna para nullable
                $table->unsignedBigInteger('accompanied_person_id')->nullable()->change();
                // Adicionar a foreign key de volta, mas nullable
                try {
                    $table->foreign('accompanied_person_id')->references('id')->on('accompanied_people')->onDelete('set null');
                } catch (\Exception $e) {
                    // Pode falhar se a foreign key já existir, não é crítico
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vital_signs', function (Blueprint $table) {
            if (Schema::hasColumn('vital_signs', 'accompanied_person_id')) {
                // Remover a foreign key antes de alterar para not nullable
                $table->dropForeign(['accompanied_person_id']);
                $table->unsignedBigInteger('accompanied_person_id')->nullable(false)->change();
                // Adicionar a foreign key de volta (se era not nullable originalmente)
                $table->foreign('accompanied_person_id')->references('id')->on('accompanied_people')->onDelete('cascade');
            }
        });
    }
};
