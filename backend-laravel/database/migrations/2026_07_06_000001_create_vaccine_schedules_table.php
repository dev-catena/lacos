<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vaccine_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('vaccine_name', 100);
            $table->string('dose', 50);            // "1ª dose", "Reforço 1", etc.
            $table->unsignedTinyInteger('age_months'); // idade recomendada em meses
            $table->string('age_label', 30);       // "Ao nascer", "2 meses", "1 ano", etc.
            $table->text('description')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedSmallInteger('order')->default(0); // ordem de exibição
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vaccine_schedules');
    }
};
