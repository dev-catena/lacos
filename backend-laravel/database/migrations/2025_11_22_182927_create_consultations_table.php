<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consultations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('groups')->onDelete('cascade');
            $table->foreignId('doctor_id')->nullable()->constrained('doctors')->onDelete('set null');
            
            $table->enum('type', ['urgency', 'medical', 'fisioterapia', 'exames', 'common'])->default('medical');
            $table->string('title', 200);
            $table->timestamp('consultation_date');
            
            $table->string('doctor_name')->nullable(); // Nome manual se não for um doutor cadastrado
            $table->string('location', 500)->nullable();
            
            $table->text('summary')->nullable(); // Resumo da consulta
            $table->text('diagnosis')->nullable(); // Diagnóstico/avaliação
            $table->text('treatment')->nullable(); // Tratamento prescrito
            $table->text('notes')->nullable(); // Observações gerais
            
            $table->boolean('is_urgency')->default(false);
            $table->enum('status', ['scheduled', 'completed', 'cancelled'])->default('completed');
            
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            
            // Índices para melhor performance
            $table->index('group_id');
            $table->index('consultation_date');
            $table->index('type');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultations');
    }
};
