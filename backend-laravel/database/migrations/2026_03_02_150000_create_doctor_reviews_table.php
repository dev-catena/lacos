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
        Schema::create('doctor_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained('appointments')->onDelete('cascade');
            // doctor_id pode apontar para users (profile=doctor) ou tabela doctors
            $table->unsignedBigInteger('doctor_id');
            $table->foreignId('author_id')->constrained('users')->onDelete('cascade');
            $table->integer('rating')->unsigned(); // 1 a 5
            $table->text('comment')->nullable();
            $table->timestamps();

            // Uma avaliação por appointment por autor
            $table->unique(['appointment_id', 'author_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('doctor_reviews');
    }
};
