<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StoreDisputesSeeder extends Seeder
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
            DB::table('store_disputes')->updateOrInsert(
                ['id' => $record['id']],
                $record
            );
        }
    }
}
