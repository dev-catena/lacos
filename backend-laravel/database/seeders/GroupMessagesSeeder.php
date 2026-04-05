<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GroupMessagesSeeder extends Seeder
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
    'group_id' => 3,
    'user_id' => 16,
    'content' => 'Oi',
    'type' => 'text',
    'image_url' => null,
    'is_read' => 0,
    'created_at' => '2026-01-27 18:54:09',
    'updated_at' => '2026-01-27 18:54:09',
  ),
  1 => array (
    'id' => 2,
    'group_id' => 1,
    'user_id' => 1,
    'content' => 'Teste',
    'type' => 'text',
    'image_url' => null,
    'is_read' => 0,
    'created_at' => '2026-02-02 01:51:42',
    'updated_at' => '2026-02-02 01:51:42',
  ),
  2 => array (
    'id' => 3,
    'group_id' => 1,
    'user_id' => 1,
    'content' => '',
    'type' => 'image',
    'image_url' => 'http://10.102.0.103:8000/storage/group-messages/uXDEy44k95GQ6hlU1UjUFctYvHznQaLi3gF2yjOG.jpg',
    'is_read' => 0,
    'created_at' => '2026-02-02 01:51:47',
    'updated_at' => '2026-02-02 01:51:47',
  ),
  3 => array (
    'id' => 4,
    'group_id' => 2,
    'user_id' => 1,
    'content' => 'Tes',
    'type' => 'text',
    'image_url' => null,
    'is_read' => 0,
    'created_at' => '2026-02-02 07:45:19',
    'updated_at' => '2026-02-02 07:45:19',
  ),
  4 => array (
    'id' => 5,
    'group_id' => 2,
    'user_id' => 1,
    'content' => '',
    'type' => 'image',
    'image_url' => 'http://10.102.0.103:8000/storage/group-messages/OheVeNh7QnUhItFanZYOJnuDknWkKm3glimJY4WS.jpg',
    'is_read' => 0,
    'created_at' => '2026-02-02 07:45:25',
    'updated_at' => '2026-02-02 07:45:25',
  ),
  5 => array (
    'id' => 6,
    'group_id' => 1,
    'user_id' => 1,
    'content' => '',
    'type' => 'image',
    'image_url' => 'http://10.102.0.103:8000/storage/group-messages/NQpZzU4aAuGTI6Q99aeWFiGeJ3SLpj2ZL7gqab94.png',
    'is_read' => 0,
    'created_at' => '2026-02-02 08:07:49',
    'updated_at' => '2026-02-02 08:07:49',
  ),
  6 => array (
    'id' => 7,
    'group_id' => 1,
    'user_id' => 1,
    'content' => 'Hdhdhd',
    'type' => 'text',
    'image_url' => null,
    'is_read' => 0,
    'created_at' => '2026-02-02 08:36:51',
    'updated_at' => '2026-02-02 08:36:51',
  ),
  7 => array (
    'id' => 8,
    'group_id' => 8,
    'user_id' => 16,
    'content' => '',
    'type' => 'image',
    'image_url' => 'http://10.102.0.103:8000/storage/group-messages/QEFs7Xf7zTufcbVewqMpdKGuPYdUvBLIfWUaPkMP.jpg',
    'is_read' => 0,
    'created_at' => '2026-02-04 18:49:55',
    'updated_at' => '2026-02-04 18:49:55',
  ),
  8 => array (
    'id' => 9,
    'group_id' => 8,
    'user_id' => 16,
    'content' => 'Vovó Rosa',
    'type' => 'text',
    'image_url' => null,
    'is_read' => 0,
    'created_at' => '2026-02-04 18:50:05',
    'updated_at' => '2026-02-04 18:50:05',
  ),
  9 => array (
    'id' => 10,
    'group_id' => 8,
    'user_id' => 67,
    'content' => 'Oi Rosa',
    'type' => 'text',
    'image_url' => null,
    'is_read' => 0,
    'created_at' => '2026-02-07 20:02:31',
    'updated_at' => '2026-02-07 20:02:31',
  ),
  10 => array (
    'id' => 11,
    'group_id' => 10,
    'user_id' => 70,
    'content' => 'Teste',
    'type' => 'text',
    'image_url' => null,
    'is_read' => 0,
    'created_at' => '2026-03-01 14:30:00',
    'updated_at' => '2026-03-01 14:30:00',
  ),
  11 => array (
    'id' => 12,
    'group_id' => 10,
    'user_id' => 70,
    'content' => '',
    'type' => 'image',
    'image_url' => 'http://192.168.0.20:8000/storage/group-messages/aDygwmLwZufCehvDBRQa7dWjG7rU7FvArhgvGCKl.jpg',
    'is_read' => 0,
    'created_at' => '2026-03-01 14:30:05',
    'updated_at' => '2026-03-01 14:30:05',
  ),
  12 => array (
    'id' => 13,
    'group_id' => 10,
    'user_id' => 70,
    'content' => '🔑 Código para entrar no grupo: 59BB3057

Use este código na tela "Entrar no Grupo" para participar.',
    'type' => 'text',
    'image_url' => null,
    'is_read' => 0,
    'created_at' => '2026-03-01 21:12:29',
    'updated_at' => '2026-03-01 21:12:29',
  ),
  13 => array (
    'id' => 14,
    'group_id' => 8,
    'user_id' => 60,
    'content' => 'Nao esqueca de enciar os exames',
    'type' => 'text',
    'image_url' => null,
    'is_read' => 0,
    'created_at' => '2026-03-07 15:53:02',
    'updated_at' => '2026-03-07 15:53:02',
  ),
);

        foreach ($records as $record) {
            DB::table('group_messages')->updateOrInsert(
                ['id' => $record['id']],
                $record
            );
        }
    }
}
