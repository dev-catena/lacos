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
        Schema::table('messages', function (Blueprint $table) {
            // Tornar receiver_id nullable para permitir mensagens de grupo
            $table->unsignedBigInteger('receiver_id')->nullable()->change();
            
            // Remover foreign key antiga se existir
            $table->dropForeign(['receiver_id']);
            
            // Adicionar nova foreign key que permite null
            $table->foreign('receiver_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            // Reverter para NOT NULL
            $table->dropForeign(['receiver_id']);
            $table->unsignedBigInteger('receiver_id')->nullable(false)->change();
            $table->foreign('receiver_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');
        });
    }
};

