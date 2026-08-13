<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('group_v8_ble_pairings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('paired_by')->constrained('users')->cascadeOnDelete();
            $table->string('bracelet_id', 80);
            $table->string('bracelet_name', 200)->nullable();
            $table->timestamp('paired_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_v8_ble_pairings');
    }
};
