<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StoreOrderItemsSeeder extends Seeder
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
            DB::table('store_order_items')->updateOrInsert(
                ['id' => $record['id']],
                $record
            );
        }
    }
}
