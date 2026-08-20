<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('location_gateways', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained()->cascadeOnDelete();
            $table->string('gateway_mac', 32);
            $table->string('device_name', 200)->nullable();
            $table->string('place_label', 200);
            $table->text('place_description')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();

            $table->unique(['group_id', 'gateway_mac']);
            $table->index(['group_id', 'last_seen_at']);
        });

        Schema::create('location_bracelets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained()->cascadeOnDelete();
            $table->string('bracelet_mac', 32);
            $table->string('bracelet_name', 200)->nullable();
            $table->foreignId('member_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('member_label', 200)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();

            $table->unique(['group_id', 'bracelet_mac']);
            $table->index(['group_id', 'member_user_id']);
        });

        Schema::create('location_presence_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained()->cascadeOnDelete();
            $table->foreignId('gateway_id')->nullable()->constrained('location_gateways')->nullOnDelete();
            $table->string('gateway_mac', 32)->nullable();
            $table->string('bracelet_mac', 32);
            $table->integer('rssi')->nullable();
            $table->string('place_label', 200)->nullable();
            $table->timestamp('recorded_at');
            $table->timestamps();

            $table->index(['group_id', 'bracelet_mac', 'recorded_at']);
            $table->index(['group_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('location_presence_events');
        Schema::dropIfExists('location_bracelets');
        Schema::dropIfExists('location_gateways');
    }
};
