<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PlansSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Gerado por: php artisan db:export-seeders
     */
    public function run(): void
    {
        $records =         array (
          0 => 
          array (
            'id' => 1,
            'name' => 'Básico',
            'slug' => 'basico',
            'is_default' => 1,
            'features' => '{"loja":false,"agenda":true,"midias":true,"cameras":false,"medicos":true,"arquivos":true,"receitas":true,"remedios":true,"historico":false,"smartwatch":false,"sensorQuedas":false,"sinaisVitais":true,"teleconsulta":true,"configuracoes":true,"grupoCuidados":true,"buscarCuidadores":true,"audiosRelogio":true,"localizacaoRelogio":true}',
            'created_at' => '2026-01-22 03:33:31',
            'updated_at' => '2026-06-25 00:00:00',
          ),
          1 => 
          array (
            'id' => 2,
            'name' => 'Intermediário',
            'slug' => 'intermediario',
            'is_default' => 0,
            'features' => '{"agenda": false, "midias": false, "cameras": false, "medicos": false, "arquivos": false, "remedios": false, "historico": false, "smartwatch": false, "sensorQuedas": false, "sinaisVitais": false, "configuracoes": false, "grupoCuidados": false}',
            'created_at' => '2026-01-22 03:33:31',
            'updated_at' => '2026-01-22 03:33:31',
          ),
          2 => 
          array (
            'id' => 3,
            'name' => 'Avançado',
            'slug' => 'avancado',
            'is_default' => 0,
            'features' => '{"agenda": false, "midias": false, "cameras": false, "medicos": false, "arquivos": false, "remedios": false, "historico": false, "smartwatch": false, "sensorQuedas": false, "sinaisVitais": false, "configuracoes": false, "grupoCuidados": false}',
            'created_at' => '2026-01-22 03:33:31',
            'updated_at' => '2026-01-22 03:33:31',
          ),
          3 => 
          array (
            'id' => 4,
            'name' => 'Pleno',
            'slug' => 'pleno',
            'is_default' => 0,
            'features' => '{"agenda": false, "midias": false, "cameras": false, "medicos": false, "arquivos": false, "remedios": false, "historico": false, "smartwatch": false, "sensorQuedas": false, "sinaisVitais": false, "configuracoes": false, "grupoCuidados": false}',
            'created_at' => '2026-01-22 03:33:31',
            'updated_at' => '2026-01-22 03:33:31',
          ),
        );

        $existingColumns = array_flip(Schema::getColumnListing('plans'));
        foreach ($records as $record) {
            $filtered = array_intersect_key($record, $existingColumns);
            DB::table('plans')->updateOrInsert(
                ['id' => $record['id']],
                $filtered
            );
        }
    }
}
