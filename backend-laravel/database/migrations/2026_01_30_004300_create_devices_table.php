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
        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->string('nickname'); // Apelido do dispositivo
            $table->enum('type', ['smartwatch', 'sensor']); // Tipo do dispositivo
            $table->string('identifier')->unique(); // Identificador único (número)
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null'); // Usuário/paciente vinculado
            $table->foreignId('group_id')->nullable()->constrained('groups')->onDelete('set null'); // Grupo vinculado
            $table->timestamps();
            
            $table->index(['identifier']);
            $table->index(['user_id']);
            $table->index(['group_id']);
            $table->index(['type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};
