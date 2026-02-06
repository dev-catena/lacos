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
        Schema::create('user_notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            
            // Preferências para médicos
            $table->boolean('appointment_patient_notification')->default(true)->comment('Notificação de consultas 10 min antes');
            $table->boolean('vital_signs_basal_change')->default(true)->comment('Alteração acima de 50% da basal');
            
            // Preferências para outros perfis (mantidas para compatibilidade)
            $table->boolean('medication_reminders')->default(true);
            $table->boolean('medication_late_alerts')->default(true);
            $table->boolean('medication_running_out')->default(true);
            $table->boolean('appointment_reminders')->default(true);
            $table->boolean('appointment_confirmation')->default(true);
            $table->boolean('appointment_cancellation')->default(true);
            $table->boolean('vital_signs_alerts')->default(true);
            $table->boolean('vital_signs_abnormal')->default(true);
            $table->boolean('vital_signs_reminders')->default(false);
            $table->boolean('group_invites')->default(true);
            $table->boolean('group_member_added')->default(true);
            $table->boolean('group_changes')->default(false);
            $table->boolean('system_updates')->default(true);
            $table->boolean('news_and_tips')->default(false);
            $table->boolean('email_notifications')->default(true);
            
            $table->timestamps();
            
            // Garantir que cada usuário tenha apenas um registro
            $table->unique('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_notification_preferences');
    }
};
