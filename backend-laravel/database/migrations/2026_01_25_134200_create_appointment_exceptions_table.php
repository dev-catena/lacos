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
        Schema::create('appointment_exceptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained('appointments')->onDelete('cascade');
            $table->date('exception_date'); // Data que será excluída da recorrência
            $table->text('reason')->nullable(); // Motivo da exclusão (opcional)
            $table->timestamps();
            
            // Índice para busca rápida
            $table->index(['appointment_id', 'exception_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointment_exceptions');
    }
};
