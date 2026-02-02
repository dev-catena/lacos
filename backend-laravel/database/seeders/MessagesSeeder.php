<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MessagesSeeder extends Seeder
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
    'sender_id' => 1,
    'receiver_id' => 9,
    'group_id' => 2,
    'message' => 'Oi lau',
    'type' => 'text',
    'image_url' => NULL,
    'is_read' => 0,
    'read_at' => NULL,
    'created_at' => '2026-02-02 08:37:08',
    'updated_at' => '2026-02-02 08:37:08',
  ),
);

        foreach ($records as $record) {
            DB::table('messages')->updateOrInsert(
                ['id' => $record['id']],
                $record
            );
        }
    }
}
