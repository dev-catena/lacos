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
  0 => 
  array (
    'id' => 1,
    'user_id' => 1,
    'plan_id' => 1,
    'is_active' => 1,
    'started_at' => '2026-01-22 03:33:33',
    'expires_at' => NULL,
    'created_at' => '2026-01-22 03:33:33',
    'updated_at' => '2026-01-22 03:33:33',
  ),
  1 => 
  array (
    'id' => 2,
    'user_id' => 2,
    'plan_id' => 1,
    'is_active' => 1,
    'started_at' => '2026-01-22 03:33:33',
    'expires_at' => NULL,
    'created_at' => '2026-01-22 03:33:33',
    'updated_at' => '2026-01-22 03:33:33',
  ),
  2 => 
  array (
    'id' => 3,
    'user_id' => 3,
    'plan_id' => 1,
    'is_active' => 1,
    'started_at' => '2026-01-24 14:18:48',
    'expires_at' => NULL,
    'created_at' => '2026-01-24 14:18:48',
    'updated_at' => '2026-01-24 14:18:48',
  ),
  3 => 
  array (
    'id' => 5,
    'user_id' => 9,
    'plan_id' => 1,
    'is_active' => 1,
    'started_at' => '2026-01-24 19:38:07',
    'expires_at' => NULL,
    'created_at' => '2026-01-24 19:38:07',
    'updated_at' => '2026-01-24 19:38:07',
  ),
  4 => 
  array (
    'id' => 6,
    'user_id' => 16,
    'plan_id' => 1,
    'is_active' => 1,
    'started_at' => '2026-01-27 18:24:42',
    'expires_at' => NULL,
    'created_at' => '2026-01-27 18:24:42',
    'updated_at' => '2026-01-27 18:24:42',
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
