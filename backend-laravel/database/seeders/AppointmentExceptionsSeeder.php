<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AppointmentExceptionsSeeder extends Seeder
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
            DB::table('appointment_exceptions')->updateOrInsert(
                ['id' => $record['id']],
                $record
            );
        }
    }
}
