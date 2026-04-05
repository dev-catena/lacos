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
        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained()->onDelete('cascade');
            // doctor_id sem foreign key para permitir apontar para doctors OU users (profile='doctor')
            $table->unsignedBigInteger('doctor_id')->nullable();
            $table->string('doctor_name')->nullable(); // Nome do médico (para casos onde não há doctor_id)
            $table->string('doctor_specialty')->nullable(); // Especialidade do médico
            $table->string('doctor_crm')->nullable(); // CRM do médico
            $table->date('prescription_date'); // Data da receita
            $table->text('notes')->nullable(); // Observações gerais da receita
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade'); // Quem criou a receita
            $table->timestamps();
            $table->softDeletes();
            
            // Índices
            $table->index(['group_id', 'prescription_date']);
            $table->index('doctor_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prescriptions');
    }
};
