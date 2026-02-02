<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GroupActivitiesSeeder extends Seeder
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
    'id' => 3,
    'group_id' => 2,
    'user_id' => NULL,
    'action_type' => 'member_removed',
    'description' => 'Dede Dias foi removido do grupo',
    'metadata' => '{"removed_user_id": "8"}',
    'created_at' => '2026-01-24 21:55:52',
    'updated_at' => '2026-01-24 21:55:52',
  ),
  1 => 
  array (
    'id' => 4,
    'group_id' => 2,
    'user_id' => 8,
    'action_type' => 'member_joined',
    'description' => 'Dede Dias entrou no grupo como paciente',
    'metadata' => '{"role": "patient"}',
    'created_at' => '2026-01-24 23:04:44',
    'updated_at' => '2026-01-24 23:04:44',
  ),
  2 => 
  array (
    'id' => 31,
    'group_id' => 3,
    'user_id' => 10,
    'action_type' => 'member_joined',
    'description' => 'Dalva Ruback entrou no grupo como paciente',
    'metadata' => '{"role": "patient"}',
    'created_at' => '2026-01-28 19:36:02',
    'updated_at' => '2026-01-28 19:36:02',
  ),
  3 => 
  array (
    'id' => 32,
    'group_id' => 3,
    'user_id' => NULL,
    'action_type' => 'member_joined',
    'description' => 'Darley Wilson  Dias entrou no grupo como cuidador',
    'metadata' => '{"role": "caregiver"}',
    'created_at' => '2026-01-28 20:40:26',
    'updated_at' => '2026-01-28 20:40:26',
  ),
  4 => 
  array (
    'id' => 33,
    'group_id' => 3,
    'user_id' => NULL,
    'action_type' => 'appointment_created',
    'description' => 'Darley Wilson  Dias agendou um consulta médica: Consulta Dra Marcela para 28/01/2026',
    'metadata' => '{"appointment_id": 12, "appointment_date": "2026-01-28T20:41:13.000000Z", "appointment_type": "medical", "appointment_title": "Consulta Dra Marcela"}',
    'created_at' => '2026-01-28 20:44:08',
    'updated_at' => '2026-01-28 20:44:08',
  ),
  5 => 
  array (
    'id' => 35,
    'group_id' => 2,
    'user_id' => 1,
    'action_type' => 'prescription_created',
    'description' => 'Adriana aparecida Dias criou uma nova receita médica',
    'metadata' => '{"prescription_id": 10}',
    'created_at' => '2026-02-02 08:35:44',
    'updated_at' => '2026-02-02 08:35:44',
  ),
);

        foreach ($records as $record) {
            DB::table('group_activities')->updateOrInsert(
                ['id' => $record['id']],
                $record
            );
        }
    }
}
