<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('group_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained()->onDelete('cascade');
            $table->foreignId('posted_by_user_id')->constrained('users')->onDelete('cascade');
            $table->enum('type', ['image', 'video']);
            $table->string('file_path', 500);
            $table->string('url', 500);
            $table->string('thumbnail_url', 500)->nullable();
            $table->string('thumbnail_path', 500)->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Índices
            $table->index(['group_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('group_media');
    }
};

