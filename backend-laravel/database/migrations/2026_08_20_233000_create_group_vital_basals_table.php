<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('group_vital_basals')) {
            return;
        }

        Schema::create('group_vital_basals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('groups')->cascadeOnDelete();
            $table->date('basal_date');
            $table->string('type', 40); // heart_rate, oxygen_saturation, blood_pressure, temperature
            $table->json('value'); // número ou {systolic, diastolic} / {value, samples_used, windows}
            $table->unsignedTinyInteger('samples_used')->default(0);
            $table->string('unit', 20)->nullable();
            $table->timestamps();

            $table->unique(['group_id', 'basal_date', 'type']);
            $table->index(['group_id', 'type', 'basal_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_vital_basals');
    }
};
