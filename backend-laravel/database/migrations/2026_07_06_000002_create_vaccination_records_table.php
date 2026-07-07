<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vaccination_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained()->onDelete('cascade');
            $table->foreignId('accompanied_person_id')->nullable()->constrained('accompanied_people')->onDelete('set null');
            $table->foreignId('vaccine_schedule_id')->nullable()->constrained('vaccine_schedules')->onDelete('set null');
            $table->string('vaccine_name', 100);
            $table->string('dose', 50);
            $table->date('applied_at');
            $table->string('batch_number', 50)->nullable();
            $table->string('location', 150)->nullable();       // UBS, clínica, hospital
            $table->string('professional_name', 100)->nullable();
            $table->text('notes')->nullable();
            $table->string('document_path')->nullable();       // foto/PDF da carteirinha
            $table->string('document_mime_type', 50)->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vaccination_records');
    }
};
