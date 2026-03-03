<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Rastreia entrada de médico e paciente na videoconferência.
     * Janela: 15 min antes até 40 min depois do horário agendado.
     * - Médico não entra → reembolso ao paciente
     * - Paciente não entra → libera pagamento ao médico
     */
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            if (!Schema::hasColumn('appointments', 'doctor_joined_at')) {
                $table->timestamp('doctor_joined_at')->nullable()->after('platform_amount');
            }
            if (!Schema::hasColumn('appointments', 'patient_joined_at')) {
                $table->timestamp('patient_joined_at')->nullable()->after('doctor_joined_at');
            }
            if (!Schema::hasColumn('appointments', 'patient_joined_by_user_id')) {
                $table->unsignedBigInteger('patient_joined_by_user_id')->nullable()->after('patient_joined_at');
            }
            if (!Schema::hasColumn('appointments', 'absence_detected_at')) {
                $table->timestamp('absence_detected_at')->nullable()->after('patient_joined_by_user_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $columns = ['doctor_joined_at', 'patient_joined_at', 'patient_joined_by_user_id', 'absence_detected_at'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('appointments', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
