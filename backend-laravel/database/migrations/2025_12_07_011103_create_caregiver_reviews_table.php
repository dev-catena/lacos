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
        Schema::create('caregiver_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('caregiver_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('author_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('group_id')->nullable()->constrained('groups')->onDelete('set null');
            $table->integer('rating')->unsigned(); // 1 a 5
            $table->text('comment');
            $table->timestamps();
            
            // Evitar múltiplas avaliações do mesmo autor para o mesmo cuidador
            $table->unique(['caregiver_id', 'author_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('caregiver_reviews');
    }
};

