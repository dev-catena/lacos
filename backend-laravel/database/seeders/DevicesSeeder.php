<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DevicesSeeder extends Seeder
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
    'nickname' => 'Bracelete',
    'type' => 'smartwatch',
    'identifier' => '123456789',
    'user_id' => 1,
    'group_id' => 1,
    'created_at' => '2026-01-30 00:55:25',
    'updated_at' => '2026-01-30 00:55:25',
  ),
  1 => 
  array (
    'id' => 2,
    'nickname' => 'Smartsole',
    'type' => 'sensor',
    'identifier' => '852258',
    'user_id' => 1,
    'group_id' => 1,
    'created_at' => '2026-02-02 00:49:48',
    'updated_at' => '2026-02-02 00:49:48',
  ),
);

        foreach ($records as $record) {
            DB::table('devices')->updateOrInsert(
                ['id' => $record['id']],
                $record
            );
        }
    }
}
