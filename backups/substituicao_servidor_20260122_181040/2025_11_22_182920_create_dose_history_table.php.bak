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
        Schema::create('dose_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medication_id')->constrained()->onDelete('cascade');
            $table->timestamp('scheduled_time');
            $table->enum('status', ['pending', 'taken', 'missed', 'skipped'])->default('pending');
            $table->timestamp('taken_at')->nullable();
            $table->foreignId('taken_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('notes')->nullable();
            $table->text('skip_reason')->nullable();
            $table->timestamps();
            
            $table->index(['medication_id', 'scheduled_time']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dose_history');
    }
};
