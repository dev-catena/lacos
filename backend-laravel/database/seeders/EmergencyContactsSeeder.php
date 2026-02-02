<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EmergencyContactsSeeder extends Seeder
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
    'group_id' => 2,
    'name' => 'Darley',
    'relationship' => 'Contato Rápido',
    'phone' => '5555553198310',
    'alternate_phone' => NULL,
    'is_primary' => 0,
    'photo' => 'emergency_contacts/XJ8fMTfYXlZxiOrm5Bi6qBo9WHPokRWBxUMAVp27.jpg',
    'notes' => NULL,
    'created_at' => '2026-01-24 13:37:22',
    'updated_at' => '2026-01-24 23:05:50',
  ),
  1 => 
  array (
    'id' => 2,
    'group_id' => 2,
    'name' => 'Maria',
    'relationship' => 'Contato Rápido',
    'phone' => '5531985858585',
    'alternate_phone' => NULL,
    'is_primary' => 0,
    'photo' => 'emergency_contacts/MXPqBexFJl7J5InqDxqvpVrBHcoQwpTT1y9gjRrW.jpg',
    'notes' => NULL,
    'created_at' => '2026-01-24 13:38:22',
    'updated_at' => '2026-01-24 13:38:22',
  ),
  2 => 
  array (
    'id' => 3,
    'group_id' => 2,
    'name' => 'Antonio',
    'relationship' => 'SOS',
    'phone' => '5555319858585',
    'alternate_phone' => NULL,
    'is_primary' => 1,
    'photo' => 'emergency_contacts/w5cFsAvHcyaCyovHwMVkLlNU74HmD87QvRnuBijb.jpg',
    'notes' => NULL,
    'created_at' => '2026-01-24 13:38:22',
    'updated_at' => '2026-01-24 23:05:50',
  ),
  3 => 
  array (
    'id' => 4,
    'group_id' => 1,
    'name' => 'Leley',
    'relationship' => 'Contato Rápido',
    'phone' => '5531983104230',
    'alternate_phone' => NULL,
    'is_primary' => 0,
    'photo' => 'emergency_contacts/8LnIsh4Lbhcp4CFZma5ExPU2qCMyp6zqHyU6DakL.jpg',
    'notes' => NULL,
    'created_at' => '2026-01-24 23:14:50',
    'updated_at' => '2026-01-25 00:07:45',
  ),
  4 => 
  array (
    'id' => 5,
    'group_id' => 1,
    'name' => 'Andreia',
    'relationship' => 'Contato Rápido',
    'phone' => '5555555555319',
    'alternate_phone' => NULL,
    'is_primary' => 0,
    'photo' => 'emergency_contacts/Wy7ce4WkcLdlInND8IexEla6z0XhPYwX5XsdZUK8.jpg',
    'notes' => NULL,
    'created_at' => '2026-01-24 23:14:50',
    'updated_at' => '2026-01-25 00:07:45',
  ),
  5 => 
  array (
    'id' => 6,
    'group_id' => 1,
    'name' => 'Darley',
    'relationship' => 'SOS',
    'phone' => '5531983104230',
    'alternate_phone' => NULL,
    'is_primary' => 1,
    'photo' => 'emergency_contacts/1UE8oIZHHBIYegtKSss1bt9Aclgbc8LamLIvE7Ag.jpg',
    'notes' => NULL,
    'created_at' => '2026-01-24 23:14:50',
    'updated_at' => '2026-01-25 00:13:59',
  ),
);

        foreach ($records as $record) {
            DB::table('emergency_contacts')->updateOrInsert(
                ['id' => $record['id']],
                $record
            );
        }
    }
}
