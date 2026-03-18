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
  0 => array (
    'id' => 1,
    'group_id' => 1,
    'user_id' => 8,
    'name' => 'Dede Dias',
    'last_name' => null,
    'gender' => null,
    'birth_date' => null,
    'blood_type' => null,
    'weight' => null,
    'height' => null,
    'allergies' => null,
    'chronic_diseases' => null,
    'medications_in_use' => null,
    'email' => 'dede@gmail.com',
    'phone' => '+5531983104230',
    'address' => null,
    'profile_photo' => null,
    'vaccination_card_photo' => null,
    'health_insurance_photo' => null,
    'created_at' => '2026-01-25 01:53:46',
    'updated_at' => '2026-01-25 01:53:46',
    'deleted_at' => null,
  ),
  1 => array (
    'id' => 2,
    'group_id' => 2,
    'user_id' => 3,
    'name' => 'Clotilde Madruga',
    'last_name' => null,
    'gender' => null,
    'birth_date' => null,
    'blood_type' => null,
    'weight' => null,
    'height' => null,
    'allergies' => null,
    'chronic_diseases' => null,
    'medications_in_use' => null,
    'email' => 'clotilde@gmail.com',
    'phone' => '+5531955555555',
    'address' => null,
    'profile_photo' => null,
    'vaccination_card_photo' => null,
    'health_insurance_photo' => null,
    'created_at' => '2026-01-25 23:09:09',
    'updated_at' => '2026-01-25 23:09:09',
    'deleted_at' => null,
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
