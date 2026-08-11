<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('v8_gateways', function (Blueprint $table) {
            $table->id();
            $table->uuid('device_id')->unique();
            $table->string('device_token_hash', 80)->nullable()->index();
            $table->string('name', 200)->nullable();
            $table->string('bracelet_mac', 32)->nullable();
            $table->foreignId('group_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('paired_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamp('paired_at')->nullable();
            $table->timestamps();

            $table->index(['group_id', 'last_seen_at']);
        });

        Schema::create('v8_gateway_pairings', function (Blueprint $table) {
            $table->id();
            $table->uuid('pairing_id')->unique();
            $table->string('code', 10)->index();
            $table->string('poll_secret', 80);
            $table->uuid('device_id');
            $table->string('name', 200)->nullable();
            $table->enum('status', ['pending', 'claimed', 'expired'])->default('pending');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('group_id')->nullable()->constrained()->nullOnDelete();
            $table->string('device_token', 80)->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->index(['pairing_id', 'status']);
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('v8_gateway_pairings');
        Schema::dropIfExists('v8_gateways');
    }
};
