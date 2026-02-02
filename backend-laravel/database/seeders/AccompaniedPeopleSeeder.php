<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AccompaniedPeopleSeeder extends Seeder
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
    'group_id' => 1,
    'user_id' => 8,
    'name' => 'Dede Dias',
    'last_name' => NULL,
    'gender' => NULL,
    'birth_date' => NULL,
    'blood_type' => NULL,
    'weight' => NULL,
    'height' => NULL,
    'allergies' => NULL,
    'chronic_diseases' => NULL,
    'medications_in_use' => NULL,
    'email' => 'dede@gmail.com',
    'phone' => '+5531983104230',
    'address' => NULL,
    'profile_photo' => NULL,
    'vaccination_card_photo' => NULL,
    'health_insurance_photo' => NULL,
    'created_at' => '2026-01-25 01:53:46',
    'updated_at' => '2026-01-25 01:53:46',
    'deleted_at' => NULL,
  ),
  1 => 
  array (
    'id' => 2,
    'group_id' => 2,
    'user_id' => 3,
    'name' => 'Clotilde Madruga',
    'last_name' => NULL,
    'gender' => NULL,
    'birth_date' => NULL,
    'blood_type' => NULL,
    'weight' => NULL,
    'height' => NULL,
    'allergies' => NULL,
    'chronic_diseases' => NULL,
    'medications_in_use' => NULL,
    'email' => 'clotilde@gmail.com',
    'phone' => '+5531955555555',
    'address' => NULL,
    'profile_photo' => NULL,
    'vaccination_card_photo' => NULL,
    'health_insurance_photo' => NULL,
    'created_at' => '2026-01-25 23:09:09',
    'updated_at' => '2026-01-25 23:09:09',
    'deleted_at' => NULL,
  ),
);

        foreach ($records as $record) {
            DB::table('accompanied_people')->updateOrInsert(
                ['id' => $record['id']],
                $record
            );
        }
    }
}
