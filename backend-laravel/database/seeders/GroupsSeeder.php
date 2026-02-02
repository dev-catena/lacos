<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GroupsSeeder extends Seeder
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
    'name' => 'Vovó 71',
    'description' => 'Cuidar da vovó',
    'code' => '570B23CD',
    'photo' => 'groups/group_1_69742423600778.64773303.jpg',
    'monitor_blood_pressure' => 0,
    'monitor_heart_rate' => 1,
    'monitor_oxygen_saturation' => 1,
    'monitor_blood_glucose' => 0,
    'monitor_temperature' => 0,
    'monitor_respiratory_rate' => 0,
    'accompanied_notify_medication' => 1,
    'accompanied_notify_appointment' => 1,
    'accompanied_access_history' => 1,
    'accompanied_access_medication' => 1,
    'accompanied_access_schedule' => 1,
    'accompanied_access_chat' => 0,
    'admin_user_id' => 1,
    'type' => 'care',
    'is_active' => 1,
    'created_by' => 1,
    'created_at' => NULL,
    'updated_at' => '2026-01-24 01:45:07',
    'deleted_at' => NULL,
  ),
  1 => 
  array (
    'id' => 2,
    'name' => 'Vovó Nervosa',
    'description' => 'Vovó',
    'code' => 'CCD25201',
    'photo' => 'groups/group_2_69742447b4c687.82309298.png',
    'monitor_blood_pressure' => 0,
    'monitor_heart_rate' => 0,
    'monitor_oxygen_saturation' => 0,
    'monitor_blood_glucose' => 1,
    'monitor_temperature' => 1,
    'monitor_respiratory_rate' => 0,
    'accompanied_notify_medication' => 1,
    'accompanied_notify_appointment' => 1,
    'accompanied_access_history' => 1,
    'accompanied_access_medication' => 1,
    'accompanied_access_schedule' => 1,
    'accompanied_access_chat' => 0,
    'admin_user_id' => 1,
    'type' => 'care',
    'is_active' => 1,
    'created_by' => 1,
    'created_at' => NULL,
    'updated_at' => '2026-01-25 14:17:58',
    'deleted_at' => NULL,
  ),
  2 => 
  array (
    'id' => 3,
    'name' => 'Dalva Ruback',
    'description' => 'Vovó Dalva',
    'code' => '65028053',
    'photo' => NULL,
    'monitor_blood_pressure' => 0,
    'monitor_heart_rate' => 0,
    'monitor_oxygen_saturation' => 0,
    'monitor_blood_glucose' => 0,
    'monitor_temperature' => 0,
    'monitor_respiratory_rate' => 0,
    'accompanied_notify_medication' => 1,
    'accompanied_notify_appointment' => 1,
    'accompanied_access_history' => 1,
    'accompanied_access_medication' => 1,
    'accompanied_access_schedule' => 1,
    'accompanied_access_chat' => 1,
    'admin_user_id' => 16,
    'type' => 'care',
    'is_active' => 1,
    'created_by' => 16,
    'created_at' => NULL,
    'updated_at' => '2026-01-28 19:41:23',
    'deleted_at' => NULL,
  ),
  3 => 
  array (
    'id' => 4,
    'name' => 'Dalva Ruback',
    'description' => NULL,
    'code' => 'D842B3D9',
    'photo' => NULL,
    'monitor_blood_pressure' => 0,
    'monitor_heart_rate' => 0,
    'monitor_oxygen_saturation' => 0,
    'monitor_blood_glucose' => 0,
    'monitor_temperature' => 0,
    'monitor_respiratory_rate' => 0,
    'accompanied_notify_medication' => 1,
    'accompanied_notify_appointment' => 1,
    'accompanied_access_history' => 1,
    'accompanied_access_medication' => 1,
    'accompanied_access_schedule' => 1,
    'accompanied_access_chat' => 0,
    'admin_user_id' => 16,
    'type' => 'care',
    'is_active' => 1,
    'created_by' => 16,
    'created_at' => NULL,
    'updated_at' => NULL,
    'deleted_at' => NULL,
  ),
);

        foreach ($records as $record) {
            DB::table('groups')->updateOrInsert(
                ['id' => $record['id']],
                $record
            );
        }
    }
}
