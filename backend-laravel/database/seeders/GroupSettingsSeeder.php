<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GroupSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $records = array ();

        foreach ($records as $record) {
            DB::table('group_settings')->updateOrInsert(
                ['id' => $record['id']],
                $record
            );
        }
    }
}
