<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PlansSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $records = array (
  0 => 
  array (
    'id' => 1,
    'name' => 'Básico',
    'slug' => 'basico',
    'is_default' => 1,
    'features' => '{"loja": false, "agenda": true, "midias": false, "cameras": false, "medicos": false, "arquivos": false, "receitas": true, "remedios": true, "historico": false, "smartwatch": true, "sensorQuedas": false, "sinaisVitais": true, "configuracoes": true, "grupoCuidados": true, "buscarCuidadores": true}',
    'created_at' => '2026-01-22 03:33:31',
    'updated_at' => '2026-02-02 01:32:38',
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

        foreach ($records as $record) {
            DB::table('plans')->updateOrInsert(
                ['id' => $record['id']],
                $record
            );
        }
    }
}
