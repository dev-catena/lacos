<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stream_agent_pairings', function (Blueprint $table) {
            $table->id();
            $table->uuid('pairing_id')->unique();
            $table->string('code', 10);
            $table->string('poll_secret', 80);
            $table->string('nome', 200)->nullable();
            $table->enum('status', ['pending', 'claimed', 'expired'])->default('pending');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('agent_token', 80)->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->index(['pairing_id', 'status']);
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stream_agent_pairings');
    }
};
