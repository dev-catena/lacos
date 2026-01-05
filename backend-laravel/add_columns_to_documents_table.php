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
        Schema::table('documents', function (Blueprint $table) {
            // Adicionar colunas se não existirem
            if (!Schema::hasColumn('documents', 'doctor_id')) {
                $table->foreignId('doctor_id')->nullable()->after('user_id')->constrained('doctors')->onDelete('set null');
            }
            
            if (!Schema::hasColumn('documents', 'consultation_id')) {
                $table->unsignedBigInteger('consultation_id')->nullable()->after('doctor_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('documents', function (Blueprint $table) {
            if (Schema::hasColumn('documents', 'doctor_id')) {
                $table->dropForeign(['doctor_id']);
                $table->dropColumn('doctor_id');
            }
            
            if (Schema::hasColumn('documents', 'consultation_id')) {
                $table->dropColumn('consultation_id');
            }
        });
    }
};








