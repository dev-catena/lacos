<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CaregiverCoursesSeeder extends Seeder
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
    'id' => 3,
    'user_id' => 62,
    'name' => 'Geriatria',
    'institution' => 'Ufmg',
    'year' => '2026',
    'description' => 'Top',
    'certificate_url' => null,
    'created_at' => '2026-02-06 15:03:31',
    'updated_at' => '2026-02-06 15:03:31',
  ),
  1 => array (
    'id' => 7,
    'user_id' => 25,
    'name' => 'Operação de fimose em helicópteros',
    'institution' => 'Hospital das clínicas',
    'year' => '2026',
    'description' => null,
    'certificate_url' => null,
    'created_at' => '2026-02-07 20:40:06',
    'updated_at' => '2026-02-07 20:40:06',
  ),
  2 => array (
    'id' => 8,
    'user_id' => 25,
    'name' => 'Curso x',
    'institution' => 'X',
    'year' => '2026',
    'description' => null,
    'certificate_url' => null,
    'created_at' => '2026-02-07 20:40:06',
    'updated_at' => '2026-02-07 20:40:06',
  ),
  3 => array (
    'id' => 46,
    'user_id' => 68,
    'name' => 'Curso de operações de risco',
    'institution' => 'Instituição mineira',
    'year' => '2026',
    'description' => null,
    'certificate_url' => null,
    'created_at' => '2026-03-02 09:43:55',
    'updated_at' => '2026-03-02 09:43:55',
  ),
  4 => array (
    'id' => 48,
    'user_id' => 71,
    'name' => 'Aperfeiçoamento cuidado de idosos',
    'institution' => 'Ufjf',
    'year' => '2006',
    'description' => 'Vvvv',
    'certificate_url' => null,
    'created_at' => '2026-03-06 18:35:55',
    'updated_at' => '2026-03-06 18:35:55',
  ),
);

        foreach ($records as $record) {
            DB::table('caregiver_courses')->updateOrInsert(
                ['id' => $record['id']],
                $record
            );
        }
    }
}
