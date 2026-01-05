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
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->boolean('is_default')->default(false);
            
            // Funcionalidades como JSON
            $table->json('features')->nullable();
            
            $table->timestamps();
        });

        // Inserir os 4 planos padrão
        DB::table('plans')->insert([
            [
                'name' => 'Básico',
                'slug' => 'basico',
                'is_default' => true,
                'features' => json_encode([
                    'grupoCuidados' => false,
                    'historico' => false,
                    'remedios' => false,
                    'agenda' => false,
                    'medicos' => false,
                    'arquivos' => false,
                    'midias' => false,
                    'sinaisVitais' => false,
                    'configuracoes' => false,
                    'smartwatch' => false,
                    'sensorQuedas' => false,
                    'cameras' => false,
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Intermediário',
                'slug' => 'intermediario',
                'is_default' => false,
                'features' => json_encode([
                    'grupoCuidados' => false,
                    'historico' => false,
                    'remedios' => false,
                    'agenda' => false,
                    'medicos' => false,
                    'arquivos' => false,
                    'midias' => false,
                    'sinaisVitais' => false,
                    'configuracoes' => false,
                    'smartwatch' => false,
                    'sensorQuedas' => false,
                    'cameras' => false,
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Avançado',
                'slug' => 'avancado',
                'is_default' => false,
                'features' => json_encode([
                    'grupoCuidados' => false,
                    'historico' => false,
                    'remedios' => false,
                    'agenda' => false,
                    'medicos' => false,
                    'arquivos' => false,
                    'midias' => false,
                    'sinaisVitais' => false,
                    'configuracoes' => false,
                    'smartwatch' => false,
                    'sensorQuedas' => false,
                    'cameras' => false,
                ]),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Pleno',
                'slug' => 'pleno',
                'is_default' => false,
                'features' => json_encode([
                    'grupoCuidados' => false,
                    'historico' => false,
                    'remedios' => false,
                    'agenda' => false,
                    'medicos' => false,
                    'arquivos' => false,
                    'midias' => false,
                    'sinaisVitais' => false,
                    'configuracoes' => false,
                    'smartwatch' => false,
                    'sensorQuedas' => false,
                    'cameras' => false,
                ]),
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
        Schema::dropIfExists('plans');
    }
};

