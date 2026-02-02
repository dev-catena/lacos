<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GroupMembersSeeder extends Seeder
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
    'user_id' => 1,
    'role' => 'admin',
    'notifications_enabled' => 1,
    'status' => 'active',
    'joined_at' => '2026-01-22 03:05:40',
    'is_active' => 1,
    'created_at' => '2026-01-22 03:05:40',
    'updated_at' => '2026-01-22 03:05:40',
  ),
  1 => 
  array (
    'id' => 2,
    'group_id' => 2,
    'user_id' => 1,
    'role' => 'admin',
    'notifications_enabled' => 1,
    'status' => 'active',
    'joined_at' => '2026-01-22 03:15:34',
    'is_active' => 1,
    'created_at' => '2026-01-22 03:15:34',
    'updated_at' => '2026-01-22 03:15:34',
  ),
  2 => 
  array (
    'id' => 4,
    'group_id' => 2,
    'user_id' => 9,
    'role' => 'health_professional',
    'notifications_enabled' => 1,
    'status' => 'active',
    'joined_at' => '2026-01-24 19:45:41',
    'is_active' => 1,
    'created_at' => '2026-01-24 19:45:41',
    'updated_at' => '2026-01-24 19:45:41',
  ),
  3 => 
  array (
    'id' => 6,
    'group_id' => 1,
    'user_id' => 8,
    'role' => 'priority_contact',
    'notifications_enabled' => 1,
    'status' => 'active',
    'joined_at' => '2026-01-24 23:12:53',
    'is_active' => 1,
    'created_at' => '2026-01-24 23:12:53',
    'updated_at' => '2026-01-24 23:12:53',
  ),
  4 => 
  array (
    'id' => 7,
    'group_id' => 2,
    'user_id' => 3,
    'role' => 'priority_contact',
    'notifications_enabled' => 1,
    'status' => 'active',
    'joined_at' => '2026-01-25 14:19:19',
    'is_active' => 1,
    'created_at' => '2026-01-25 14:19:19',
    'updated_at' => '2026-01-25 14:19:43',
  ),
  5 => 
  array (
    'id' => 8,
    'group_id' => 3,
    'user_id' => 16,
    'role' => 'admin',
    'notifications_enabled' => 1,
    'status' => 'active',
    'joined_at' => '2026-01-27 18:43:52',
    'is_active' => 1,
    'created_at' => '2026-01-27 18:43:52',
    'updated_at' => '2026-01-27 18:43:52',
  ),
  6 => 
  array (
    'id' => 9,
    'group_id' => 4,
    'user_id' => 16,
    'role' => 'admin',
    'notifications_enabled' => 1,
    'status' => 'active',
    'joined_at' => '2026-01-27 18:45:32',
    'is_active' => 1,
    'created_at' => '2026-01-27 18:45:32',
    'updated_at' => '2026-01-27 18:45:32',
  ),
  7 => 
  array (
    'id' => 13,
    'group_id' => 3,
    'user_id' => 10,
    'role' => 'priority_contact',
    'notifications_enabled' => 1,
    'status' => 'active',
    'joined_at' => '2026-01-28 19:36:02',
    'is_active' => 1,
    'created_at' => '2026-01-28 19:36:02',
    'updated_at' => '2026-01-28 19:36:02',
  ),
);

        foreach ($records as $record) {
            DB::table('group_members')->updateOrInsert(
                ['id' => $record['id']],
                $record
            );
        }
    }
}
