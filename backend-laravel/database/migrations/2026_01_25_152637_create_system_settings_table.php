<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique()->comment('Chave única da configuração');
            $table->text('value')->nullable()->comment('Valor da configuração (pode ser JSON)');
            $table->string('type')->default('string')->comment('Tipo: string, integer, boolean, json');
            $table->text('description')->nullable()->comment('Descrição da configuração');
            $table->string('category')->default('general')->comment('Categoria: recording, payment, etc');
            $table->timestamps();
        });

        // Inserir configurações padrão para gravação de áudio
        DB::table('system_settings')->insert([
            [
                'key' => 'recording_start_before_minutes',
                'value' => '15',
                'type' => 'integer',
                'description' => 'Minutos antes da consulta para permitir iniciar gravação',
                'category' => 'recording',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'recording_stop_after_end_minutes',
                'value' => '15',
                'type' => 'integer',
                'description' => 'Minutos após o fim previsto da consulta para parar de permitir iniciar gravação',
                'category' => 'recording',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'recording_max_duration_after_end_minutes',
                'value' => '30',
                'type' => 'integer',
                'description' => 'Minutos após o fim previsto da consulta para forçar parada da gravação (se iniciada antes do limite)',
                'category' => 'recording',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
