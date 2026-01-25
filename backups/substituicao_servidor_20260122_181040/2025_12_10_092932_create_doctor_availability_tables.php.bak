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
        // Tabela principal de disponibilidade do médico
        Schema::create('doctor_availability', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('doctor_id');
            $table->date('date');
            $table->boolean('is_available')->default(true);
            $table->timestamps();

            $table->foreign('doctor_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table->unique(['doctor_id', 'date']);
            $table->index('date');
        });

        // Tabela de horários disponíveis para cada dia
        Schema::create('doctor_availability_times', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('availability_id');
            $table->time('time');
            $table->timestamps();

            $table->foreign('availability_id')
                ->references('id')
                ->on('doctor_availability')
                ->onDelete('cascade');

            $table->unique(['availability_id', 'time']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('doctor_availability_times');
        Schema::dropIfExists('doctor_availability');
    }
};

