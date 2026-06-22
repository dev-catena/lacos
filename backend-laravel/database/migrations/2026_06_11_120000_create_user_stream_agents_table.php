<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_stream_agents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('stream_api', 500);
            $table->string('auth_user')->nullable();
            $table->text('auth_pass')->nullable();
            $table->json('cameras');
            $table->timestamp('linked_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'stream_api']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_stream_agents');
    }
};
