<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DoctorsSeeder extends Seeder
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
    'name' => 'Resultado da￼',
    'specialty' => 'Angiologia',
    'crm' => 'MG-588552',
    'phone' => '+5531985545451',
    'email' => 'vshdh@hsh.com',
    'address' => 'R. Cordisburgo - Kennedy, Contagem - MG, 32145-782, Brasil',
    'address_latitude' => NULL,
    'address_longitude' => NULL,
    'is_primary' => 1,
    'notes' => NULL,
    'created_at' => '2026-01-25 01:06:38',
    'updated_at' => '2026-01-25 01:06:38',
  ),
  1 => 
  array (
    'id' => 2,
    'group_id' => 2,
    'name' => 'Hahah',
    'specialty' => 'Cardiologia',
    'crm' => 'MG-845464',
    'phone' => '+55319545484',
    'email' => 'hsje@jshd.com',
    'address' => 'R. Cordisburgo - Kennedy, Contagem - MG, 32145-782, Brasil',
    'address_latitude' => NULL,
    'address_longitude' => NULL,
    'is_primary' => 1,
    'notes' => NULL,
    'created_at' => '2026-01-25 01:11:41',
    'updated_at' => '2026-01-25 01:11:41',
  ),
  2 => 
  array (
    'id' => 3,
    'group_id' => 2,
    'name' => 'Darley',
    'specialty' => 'Cirurgia Cardiovascular',
    'crm' => 'CE-548154',
    'phone' => '+5531985845464',
    'email' => 'vshd@hsh.com',
    'address' => 'Cordisburgo',
    'address_latitude' => NULL,
    'address_longitude' => NULL,
    'is_primary' => 1,
    'notes' => NULL,
    'created_at' => '2026-01-25 01:16:36',
    'updated_at' => '2026-01-25 01:16:36',
  ),
  3 => 
  array (
    'id' => 4,
    'group_id' => 1,
    'name' => 'Darkey',
    'specialty' => NULL,
    'crm' => NULL,
    'phone' => NULL,
    'email' => NULL,
    'address' => NULL,
    'address_latitude' => NULL,
    'address_longitude' => NULL,
    'is_primary' => 0,
    'notes' => NULL,
    'created_at' => '2026-01-25 01:32:24',
    'updated_at' => '2026-01-25 01:32:24',
  ),
);

        foreach ($records as $record) {
            DB::table('doctors')->updateOrInsert(
                ['id' => $record['id']],
                $record
            );
        }
    }
}
