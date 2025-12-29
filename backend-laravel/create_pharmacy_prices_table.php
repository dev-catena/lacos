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
        Schema::create('pharmacy_prices', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id'); // Usuário que informou o preço
            $table->unsignedBigInteger('group_id')->nullable(); // Grupo relacionado (opcional)
            $table->string('medication_name'); // Nome do medicamento
            $table->string('pharmacy_name'); // Nome da farmácia
            $table->string('pharmacy_address')->nullable(); // Endereço da farmácia
            $table->decimal('price', 10, 2); // Preço informado
            $table->text('notes')->nullable(); // Observações opcionais
            $table->timestamps();

            // Índices para busca rápida
            $table->index(['medication_name', 'pharmacy_name']);
            $table->index('user_id');
            $table->index('group_id');
            $table->index('created_at'); // Para ordenar por data

            // Foreign keys
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('group_id')->references('id')->on('groups')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pharmacy_prices');
    }
};








