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
        Schema::create('patient_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained()->onDelete('cascade');
            $table->foreignId('patient_user_id')->constrained('users')->onDelete('cascade');
            $table->enum('type', ['medication', 'appointment', 'vital_signs', 'sedentary']);
            $table->text('message');
            $table->text('details')->nullable();
            
            // Medication fields
            $table->foreignId('medication_id')->nullable()->constrained()->onDelete('set null');
            $table->string('medication_name')->nullable();
            $table->string('dosage', 100)->nullable();
            
            // Appointment fields
            $table->foreignId('appointment_id')->nullable()->constrained()->onDelete('set null');
            $table->string('appointment_type', 50)->nullable();
            $table->text('location')->nullable();
            
            // Vital signs fields
            $table->string('vital_sign_type', 50)->nullable();
            $table->string('value', 50)->nullable();
            $table->string('normal_range', 50)->nullable();
            
            // Control fields
            $table->boolean('is_active')->default(true);
            $table->tinyInteger('priority')->default(1); // 1=baixo, 2=médio, 3=alto
            $table->timestamp('time')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('dismissed_at')->nullable();
            $table->timestamp('taken_at')->nullable();
            
            $table->timestamps();
            
            // Índices
            $table->index(['group_id', 'patient_user_id', 'is_active']);
            $table->index(['is_active', 'time']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('patient_alerts');
    }
};

