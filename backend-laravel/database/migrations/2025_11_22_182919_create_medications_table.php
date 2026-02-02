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
        Schema::create('medications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained()->onDelete('cascade');
            $table->string('name', 200);
            $table->string('pharmaceutical_form', 50);
            $table->string('dosage', 50);
            $table->string('unit', 20);
            $table->string('administration_route', 50);
            $table->json('frequency');
            $table->json('times');
            $table->json('duration')->nullable();
            $table->foreignId('doctor_id')->nullable()->constrained()->onDelete('set null');
            $table->string('prescription_image')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('start_date');
            $table->timestamp('end_date')->nullable();
            $table->timestamp('discontinued_at')->nullable();
            $table->foreignId('discontinued_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('discontinued_reason')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medications');
    }
};
