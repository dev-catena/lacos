<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PanicEventsSeeder extends Seeder
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
    'user_id' => 8,
    'trigger_type' => 'manual',
    'latitude' => '-19.89362250',
    'longitude' => '-43.91053470',
    'location_address' => 'Rua Cordisburgo 11, Santa Ines,  - Minas Gerais',
    'call_duration' => 0,
    'call_status' => 'ongoing',
    'notes' => NULL,
    'created_at' => '2026-01-24 19:29:42',
    'updated_at' => '2026-01-24 19:29:42',
  ),
  1 => 
  array (
    'id' => 2,
    'group_id' => 2,
    'user_id' => 8,
    'trigger_type' => 'manual',
    'latitude' => '-19.89362250',
    'longitude' => '-43.91053470',
    'location_address' => 'Rua Cordisburgo 11, Santa Ines,  - Minas Gerais',
    'call_duration' => 5,
    'call_status' => 'completed',
    'notes' => NULL,
    'created_at' => '2026-01-24 19:36:17',
    'updated_at' => '2026-01-24 19:36:23',
  ),
  2 => 
  array (
    'id' => 3,
    'group_id' => 2,
    'user_id' => 8,
    'trigger_type' => 'manual',
    'latitude' => '-19.89358511',
    'longitude' => '-43.91042181',
    'location_address' => 'Rua Cordisburgo 23, Santa Ines, Belo Horizonte - MG',
    'call_duration' => 1,
    'call_status' => 'completed',
    'notes' => NULL,
    'created_at' => '2026-01-24 21:56:47',
    'updated_at' => '2026-01-24 21:56:49',
  ),
  3 => 
  array (
    'id' => 4,
    'group_id' => 1,
    'user_id' => 8,
    'trigger_type' => 'manual',
    'latitude' => '-19.89362250',
    'longitude' => '-43.91053470',
    'location_address' => 'Rua Cordisburgo 11, Santa Ines,  - Minas Gerais',
    'call_duration' => 17,
    'call_status' => 'completed',
    'notes' => NULL,
    'created_at' => '2026-01-25 00:14:39',
    'updated_at' => '2026-01-25 00:14:57',
  ),
  4 => 
  array (
    'id' => 5,
    'group_id' => 1,
    'user_id' => 8,
    'trigger_type' => 'manual',
    'latitude' => '-19.89362250',
    'longitude' => '-43.91053470',
    'location_address' => 'Rua Cordisburgo 11, Santa Ines,  - Minas Gerais',
    'call_duration' => 52,
    'call_status' => 'completed',
    'notes' => NULL,
    'created_at' => '2026-01-25 00:15:42',
    'updated_at' => '2026-01-25 00:16:35',
  ),
);

        foreach ($records as $record) {
            DB::table('panic_events')->updateOrInsert(
                ['id' => $record['id']],
                $record
            );
        }
    }
}
