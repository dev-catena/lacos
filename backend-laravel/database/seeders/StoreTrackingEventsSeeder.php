<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StoreTrackingEventsSeeder extends Seeder
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
            DB::table('store_tracking_events')->updateOrInsert(
                ['id' => $record['id']],
                $record
            );
        }
    }
}
