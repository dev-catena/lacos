<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PrescriptionsSeeder extends Seeder
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
    'id' => 5,
    'group_id' => 2,
    'doctor_id' => 3,
    'doctor_name' => 'Darley',
    'doctor_specialty' => 'Cirurgia Cardiovascular',
    'doctor_crm' => 'CE-548154',
    'prescription_date' => '2026-01-25',
    'notes' => NULL,
    'image_url' => NULL,
    'created_by' => 1,
    'created_at' => '2026-01-26 01:49:35',
    'updated_at' => '2026-01-26 02:05:49',
    'deleted_at' => '2026-01-26 02:05:49',
  ),
  1 => 
  array (
    'id' => 6,
    'group_id' => 2,
    'doctor_id' => 3,
    'doctor_name' => 'Darley',
    'doctor_specialty' => 'Cirurgia Cardiovascular',
    'doctor_crm' => 'CE-548154',
    'prescription_date' => '2026-01-25',
    'notes' => NULL,
    'image_url' => NULL,
    'created_by' => 1,
    'created_at' => '2026-01-26 01:58:25',
    'updated_at' => '2026-01-26 02:05:49',
    'deleted_at' => '2026-01-26 02:05:49',
  ),
  2 => 
  array (
    'id' => 7,
    'group_id' => 2,
    'doctor_id' => 3,
    'doctor_name' => 'Darley',
    'doctor_specialty' => 'Cirurgia Cardiovascular',
    'doctor_crm' => 'CE-548154',
    'prescription_date' => '2026-01-25',
    'notes' => NULL,
    'image_url' => NULL,
    'created_by' => 1,
    'created_at' => '2026-01-26 02:07:50',
    'updated_at' => '2026-01-26 02:07:50',
    'deleted_at' => NULL,
  ),
  3 => 
  array (
    'id' => 8,
    'group_id' => 2,
    'doctor_id' => 3,
    'doctor_name' => 'Darley',
    'doctor_specialty' => 'Cirurgia Cardiovascular',
    'doctor_crm' => 'CE-548154',
    'prescription_date' => '2026-01-25',
    'notes' => NULL,
    'image_url' => NULL,
    'created_by' => 1,
    'created_at' => '2026-01-26 02:11:49',
    'updated_at' => '2026-01-26 02:11:49',
    'deleted_at' => NULL,
  ),
  4 => 
  array (
    'id' => 9,
    'group_id' => 2,
    'doctor_id' => 3,
    'doctor_name' => 'Darley',
    'doctor_specialty' => 'Cirurgia Cardiovascular',
    'doctor_crm' => 'CE-548154',
    'prescription_date' => '2026-01-25',
    'notes' => NULL,
    'image_url' => NULL,
    'created_by' => 1,
    'created_at' => '2026-01-26 02:33:38',
    'updated_at' => '2026-01-26 02:33:38',
    'deleted_at' => NULL,
  ),
  5 => 
  array (
    'id' => 10,
    'group_id' => 2,
    'doctor_id' => 25,
    'doctor_name' => 'Leley Dias',
    'doctor_specialty' => NULL,
    'doctor_crm' => 'MG-369963',
    'prescription_date' => '2026-02-02',
    'notes' => 'Bebendo',
    'image_url' => NULL,
    'created_by' => 1,
    'created_at' => '2026-02-02 08:35:44',
    'updated_at' => '2026-02-02 08:35:44',
    'deleted_at' => NULL,
  ),
);

        foreach ($records as $record) {
            DB::table('prescriptions')->updateOrInsert(
                ['id' => $record['id']],
                $record
            );
        }
    }
}
