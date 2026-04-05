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
        Schema::create('medication_catalog', function (Blueprint $table) {
            $table->id();
            $table->string('nome_produto', 500)->index(); // Nome do medicamento (principal para busca)
            $table->string('nome_normalizado', 500)->index(); // Nome normalizado para busca (sem acentos, lowercase)
            $table->string('principio_ativo', 500)->nullable()->index(); // Princípio ativo
            $table->string('tipo_produto', 100)->nullable();
            $table->string('categoria_regulatoria', 100)->nullable();
            $table->string('numero_registro_produto', 50)->nullable()->index();
            $table->date('data_vencimento_registro')->nullable();
            $table->string('situacao_registro', 50)->nullable()->index(); // VÁLIDO, CADUCO/CANCELADO
            $table->string('classe_terapeutica', 200)->nullable()->index();
            $table->string('empresa_detentora_registro', 500)->nullable();
            $table->date('data_finalizacao_processo')->nullable();
            $table->string('numero_processo', 100)->nullable();
            
            // Campos para otimização
            $table->boolean('is_active')->default(true)->index(); // Apenas registros válidos
            $table->string('search_keywords', 1000)->nullable(); // Palavras-chave para busca rápida
            
            // Timestamps
            $table->timestamps();
            
            // Índices compostos para otimização
            $table->index(['is_active', 'situacao_registro']);
            $table->index(['nome_normalizado', 'is_active']);
            // Full-text search com nome curto (MySQL limita a 64 caracteres)
            $table->fullText(['nome_produto', 'principio_ativo', 'search_keywords'], 'med_cat_ft_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medication_catalog');
    }
};

