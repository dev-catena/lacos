<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CaregiverReviewsSeeder extends Seeder
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
    'caregiver_id' => 71,
    'author_id' => 70,
    'group_id' => 10,
    'rating' => 5,
    'comment' => 'Excelente! Super recomendo',
    'created_at' => '2026-03-06 18:52:27',
    'updated_at' => '2026-03-06 18:52:27',
  ),
);

        foreach ($records as $record) {
            DB::table('caregiver_reviews')->updateOrInsert(
                ['id' => $record['id']],
                $record
            );
        }
    }
}
