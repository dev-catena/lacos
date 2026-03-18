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
  0 => array (
    'id' => 1,
    'group_id' => 2,
    'user_id' => 8,
    'trigger_type' => 'manual',
    'latitude' => '-19.89362250',
    'longitude' => '-43.91053470',
    'location_address' => 'Rua Cordisburgo 11, Santa Ines,  - Minas Gerais',
    'call_duration' => 0,
    'call_status' => 'ongoing',
    'notes' => null,
    'created_at' => '2026-01-24 19:29:42',
    'updated_at' => '2026-01-24 19:29:42',
  ),
  1 => array (
    'id' => 2,
    'group_id' => 2,
    'user_id' => 8,
    'trigger_type' => 'manual',
    'latitude' => '-19.89362250',
    'longitude' => '-43.91053470',
    'location_address' => 'Rua Cordisburgo 11, Santa Ines,  - Minas Gerais',
    'call_duration' => 5,
    'call_status' => 'completed',
    'notes' => null,
    'created_at' => '2026-01-24 19:36:17',
    'updated_at' => '2026-01-24 19:36:23',
  ),
  2 => array (
    'id' => 3,
    'group_id' => 2,
    'user_id' => 8,
    'trigger_type' => 'manual',
    'latitude' => '-19.89358511',
    'longitude' => '-43.91042181',
    'location_address' => 'Rua Cordisburgo 23, Santa Ines, Belo Horizonte - MG',
    'call_duration' => 1,
    'call_status' => 'completed',
    'notes' => null,
    'created_at' => '2026-01-24 21:56:47',
    'updated_at' => '2026-01-24 21:56:49',
  ),
  3 => array (
    'id' => 4,
    'group_id' => 1,
    'user_id' => 8,
    'trigger_type' => 'manual',
    'latitude' => '-19.89362250',
    'longitude' => '-43.91053470',
    'location_address' => 'Rua Cordisburgo 11, Santa Ines,  - Minas Gerais',
    'call_duration' => 17,
    'call_status' => 'completed',
    'notes' => null,
    'created_at' => '2026-01-25 00:14:39',
    'updated_at' => '2026-01-25 00:14:57',
  ),
  4 => array (
    'id' => 5,
    'group_id' => 1,
    'user_id' => 8,
    'trigger_type' => 'manual',
    'latitude' => '-19.89362250',
    'longitude' => '-43.91053470',
    'location_address' => 'Rua Cordisburgo 11, Santa Ines,  - Minas Gerais',
    'call_duration' => 52,
    'call_status' => 'completed',
    'notes' => null,
    'created_at' => '2026-01-25 00:15:42',
    'updated_at' => '2026-01-25 00:16:35',
  ),
  5 => array (
    'id' => 6,
    'group_id' => 8,
    'user_id' => 60,
    'trigger_type' => 'manual',
    'latitude' => '-19.89361630',
    'longitude' => '-43.91048820',
    'location_address' => 'Rua Cordisburgo 11, Santa Ines,  - Minas Gerais',
    'call_duration' => 15,
    'call_status' => 'completed',
    'notes' => null,
    'created_at' => '2026-02-10 19:47:16',
    'updated_at' => '2026-02-10 19:47:31',
  ),
  6 => array (
    'id' => 7,
    'group_id' => 8,
    'user_id' => 60,
    'trigger_type' => 'manual',
    'latitude' => '-19.89361630',
    'longitude' => '-43.91048820',
    'location_address' => 'Rua Cordisburgo 11, Santa Ines,  - Minas Gerais',
    'call_duration' => 67,
    'call_status' => 'completed',
    'notes' => null,
    'created_at' => '2026-02-10 19:48:11',
    'updated_at' => '2026-02-10 19:49:18',
  ),
  7 => array (
    'id' => 8,
    'group_id' => 8,
    'user_id' => 60,
    'trigger_type' => 'manual',
    'latitude' => '-19.89364770',
    'longitude' => '-43.91053320',
    'location_address' => 'Rua Cordisburgo 11, Santa Ines,  - Minas Gerais',
    'call_duration' => 16,
    'call_status' => 'completed',
    'notes' => null,
    'created_at' => '2026-02-27 15:48:10',
    'updated_at' => '2026-02-27 15:48:26',
  ),
  8 => array (
    'id' => 9,
    'group_id' => 8,
    'user_id' => 60,
    'trigger_type' => 'manual',
    'latitude' => '-19.89358910',
    'longitude' => '-43.91042985',
    'location_address' => 'Rua Cordisburgo 23, Santa Ines, Belo Horizonte - MG',
    'call_duration' => 9,
    'call_status' => 'completed',
    'notes' => null,
    'created_at' => '2026-03-07 15:54:19',
    'updated_at' => '2026-03-07 15:54:28',
  ),
  9 => array (
    'id' => 10,
    'group_id' => 8,
    'user_id' => 60,
    'trigger_type' => 'manual',
    'latitude' => '-19.89353807',
    'longitude' => '-43.91037492',
    'location_address' => 'Rua Cordisburgo 23, Santa Ines, Belo Horizonte - MG',
    'call_duration' => 12,
    'call_status' => 'completed',
    'notes' => null,
    'created_at' => '2026-03-07 20:50:23',
    'updated_at' => '2026-03-07 20:50:36',
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
