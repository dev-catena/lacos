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
        Schema::create('popular_pharmacies', function (Blueprint $table) {
            $table->id();
            $table->string('name', 200); // Nome da farmácia
            $table->string('address', 500)->nullable(); // Endereço completo
            $table->string('neighborhood', 100)->nullable(); // Bairro
            $table->string('city', 100); // Cidade
            $table->string('state', 2); // Estado (UF)
            $table->string('zip_code', 10)->nullable(); // CEP
            $table->string('phone', 20)->nullable(); // Telefone
            $table->decimal('latitude', 10, 8)->nullable(); // Latitude para busca por proximidade
            $table->decimal('longitude', 11, 8)->nullable(); // Longitude para busca por proximidade
            $table->boolean('is_active')->default(true); // Se a farmácia está ativa
            $table->timestamps();
            
            // Índices para melhorar performance nas buscas
            $table->index(['city', 'state']);
            $table->index(['latitude', 'longitude']);
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('popular_pharmacies');
    }
};

