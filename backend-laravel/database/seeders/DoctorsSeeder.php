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
  0 => array (
    'id' => 1,
    'group_id' => 1,
    'name' => 'Resultado da￼',
    'specialty' => 'Angiologia',
    'crm' => 'MG-588552',
    'phone' => '+5531985545451',
    'email' => 'vshdh@hsh.com',
    'address' => 'R. Cordisburgo - Kennedy, Contagem - MG, 32145-782, Brasil',
    'address_latitude' => null,
    'address_longitude' => null,
    'is_primary' => 1,
    'notes' => null,
    'created_at' => '2026-01-25 01:06:38',
    'updated_at' => '2026-01-25 01:06:38',
  ),
  1 => array (
    'id' => 2,
    'group_id' => 2,
    'name' => 'Hahah',
    'specialty' => 'Cardiologia',
    'crm' => 'MG-845464',
    'phone' => '+55319545484',
    'email' => 'hsje@jshd.com',
    'address' => 'R. Cordisburgo - Kennedy, Contagem - MG, 32145-782, Brasil',
    'address_latitude' => null,
    'address_longitude' => null,
    'is_primary' => 1,
    'notes' => null,
    'created_at' => '2026-01-25 01:11:41',
    'updated_at' => '2026-01-25 01:11:41',
  ),
  2 => array (
    'id' => 3,
    'group_id' => 2,
    'name' => 'Darley',
    'specialty' => 'Cirurgia Cardiovascular',
    'crm' => 'CE-548154',
    'phone' => '+5531985845464',
    'email' => 'vshd@hsh.com',
    'address' => 'R. das Pedras - Lot. Triangulo de Buzios, Armação dos Búzios - RJ, 28950-000, Brasil',
    'address_latitude' => null,
    'address_longitude' => null,
    'is_primary' => 1,
    'notes' => null,
    'created_at' => '2026-01-25 01:16:36',
    'updated_at' => '2026-02-07 14:15:28',
  ),
  3 => array (
    'id' => 4,
    'group_id' => 1,
    'name' => 'Darkey',
    'specialty' => null,
    'crm' => null,
    'phone' => null,
    'email' => null,
    'address' => null,
    'address_latitude' => null,
    'address_longitude' => null,
    'is_primary' => 0,
    'notes' => null,
    'created_at' => '2026-01-25 01:32:24',
    'updated_at' => '2026-01-25 01:32:24',
  ),
  4 => array (
    'id' => 5,
    'group_id' => 8,
    'name' => 'De Tolinho',
    'specialty' => 'Angiologia',
    'crm' => 'BA-258885',
    'phone' => '+5531985485454',
    'email' => 'tolo@gmail.com',
    'address' => 'R. das Pedras - Lot. Triangulo de Buzios, Armação dos Búzios - RJ, 28950-000, Brasil',
    'address_latitude' => null,
    'address_longitude' => null,
    'is_primary' => 1,
    'notes' => 'Muito bom',
    'created_at' => '2026-02-07 13:44:30',
    'updated_at' => '2026-02-07 13:44:30',
  ),
  5 => array (
    'id' => 6,
    'group_id' => 2,
    'name' => 'Rivelino Paulo Isidoro',
    'specialty' => 'Cardiologia',
    'crm' => 'MG-222222',
    'phone' => '+5538585858888',
    'email' => 'rivelino@gmail.com',
    'address' => 'R. das Pedras - Lot. Triangulo de Buzios, Armação dos Búzios - RJ, 28950-000, Brasil',
    'address_latitude' => null,
    'address_longitude' => null,
    'is_primary' => 0,
    'notes' => null,
    'created_at' => '2026-02-07 17:01:48',
    'updated_at' => '2026-02-07 17:01:48',
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
