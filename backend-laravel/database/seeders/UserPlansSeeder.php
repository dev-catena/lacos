<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UserPlansSeeder extends Seeder
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
    'user_id' => 1,
    'plan_id' => 1,
    'is_active' => 1,
    'started_at' => '2026-01-22 03:33:33',
    'expires_at' => null,
    'created_at' => '2026-01-22 03:33:33',
    'updated_at' => '2026-01-22 03:33:33',
  ),
  1 => array (
    'id' => 2,
    'user_id' => 2,
    'plan_id' => 1,
    'is_active' => 1,
    'started_at' => '2026-01-22 03:33:33',
    'expires_at' => null,
    'created_at' => '2026-01-22 03:33:33',
    'updated_at' => '2026-01-22 03:33:33',
  ),
  2 => array (
    'id' => 3,
    'user_id' => 3,
    'plan_id' => 1,
    'is_active' => 1,
    'started_at' => '2026-01-24 14:18:48',
    'expires_at' => null,
    'created_at' => '2026-01-24 14:18:48',
    'updated_at' => '2026-01-24 14:18:48',
  ),
  3 => array (
    'id' => 5,
    'user_id' => 9,
    'plan_id' => 1,
    'is_active' => 1,
    'started_at' => '2026-01-24 19:38:07',
    'expires_at' => null,
    'created_at' => '2026-01-24 19:38:07',
    'updated_at' => '2026-01-24 19:38:07',
  ),
  4 => array (
    'id' => 6,
    'user_id' => 16,
    'plan_id' => 1,
    'is_active' => 1,
    'started_at' => '2026-01-27 18:24:42',
    'expires_at' => null,
    'created_at' => '2026-01-27 18:24:42',
    'updated_at' => '2026-01-27 18:24:42',
  ),
  5 => array (
    'id' => 8,
    'user_id' => 64,
    'plan_id' => 1,
    'is_active' => 1,
    'started_at' => '2026-02-07 19:21:04',
    'expires_at' => null,
    'created_at' => '2026-02-07 19:21:04',
    'updated_at' => '2026-02-07 19:21:04',
  ),
  6 => array (
    'id' => 9,
    'user_id' => 66,
    'plan_id' => 1,
    'is_active' => 1,
    'started_at' => '2026-02-07 19:46:01',
    'expires_at' => null,
    'created_at' => '2026-02-07 19:46:01',
    'updated_at' => '2026-02-07 19:46:01',
  ),
  7 => array (
    'id' => 10,
    'user_id' => 67,
    'plan_id' => 1,
    'is_active' => 1,
    'started_at' => '2026-02-07 20:01:17',
    'expires_at' => null,
    'created_at' => '2026-02-07 20:01:17',
    'updated_at' => '2026-02-07 20:01:17',
  ),
  8 => array (
    'id' => 11,
    'user_id' => 68,
    'plan_id' => 1,
    'is_active' => 1,
    'started_at' => '2026-02-27 14:02:33',
    'expires_at' => null,
    'created_at' => '2026-02-27 14:02:33',
    'updated_at' => '2026-02-27 14:02:33',
  ),
  9 => array (
    'id' => 12,
    'user_id' => 70,
    'plan_id' => 1,
    'is_active' => 1,
    'started_at' => '2026-02-28 14:34:45',
    'expires_at' => null,
    'created_at' => '2026-02-28 14:34:45',
    'updated_at' => '2026-02-28 14:34:45',
  ),
  10 => array (
    'id' => 13,
    'user_id' => 71,
    'plan_id' => 1,
    'is_active' => 1,
    'started_at' => '2026-03-06 18:21:02',
    'expires_at' => null,
    'created_at' => '2026-03-06 18:21:02',
    'updated_at' => '2026-03-06 18:21:02',
  ),
);

        foreach ($records as $record) {
            DB::table('user_plans')->updateOrInsert(
                ['id' => $record['id']],
                $record
            );
        }
    }
}
