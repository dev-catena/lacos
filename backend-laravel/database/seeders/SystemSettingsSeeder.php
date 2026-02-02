<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SystemSettingsSeeder extends Seeder
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
    'key' => 'recording_start_before_minutes',
    'value' => '15',
    'type' => 'integer',
    'description' => 'Minutos antes da consulta para permitir iniciar gravação',
    'category' => 'recording',
    'created_at' => '2026-01-25 15:28:49',
    'updated_at' => '2026-01-25 15:28:49',
  ),
  1 => 
  array (
    'id' => 2,
    'key' => 'recording_stop_after_end_minutes',
    'value' => '15',
    'type' => 'integer',
    'description' => 'Minutos após o fim previsto da consulta para parar de permitir iniciar gravação',
    'category' => 'recording',
    'created_at' => '2026-01-25 15:28:49',
    'updated_at' => '2026-01-25 15:28:49',
  ),
  2 => 
  array (
    'id' => 3,
    'key' => 'recording_max_duration_after_end_minutes',
    'value' => '30',
    'type' => 'integer',
    'description' => 'Minutos após o fim previsto da consulta para forçar parada da gravação (se iniciada antes do limite)',
    'category' => 'recording',
    'created_at' => '2026-01-25 15:28:49',
    'updated_at' => '2026-01-25 15:28:49',
  ),
);

        foreach ($records as $record) {
            DB::table('system_settings')->updateOrInsert(
                ['id' => $record['id']],
                $record
            );
        }
    }
}
