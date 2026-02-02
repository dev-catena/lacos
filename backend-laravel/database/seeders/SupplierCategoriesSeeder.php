<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SupplierCategoriesSeeder extends Seeder
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
    'supplier_id' => 1,
    'category' => 'Fisioterapia',
    'created_at' => '2026-02-01 16:07:38',
    'updated_at' => '2026-02-01 16:07:38',
  ),
  1 => 
  array (
    'id' => 2,
    'supplier_id' => 1,
    'category' => 'Equipamentos Médicos',
    'created_at' => '2026-02-01 16:07:38',
    'updated_at' => '2026-02-01 16:07:38',
  ),
  2 => 
  array (
    'id' => 3,
    'supplier_id' => 1,
    'category' => 'Dispositivos de Segurança',
    'created_at' => '2026-02-01 16:07:38',
    'updated_at' => '2026-02-01 16:07:38',
  ),
);

        foreach ($records as $record) {
            DB::table('supplier_categories')->updateOrInsert(
                ['id' => $record['id']],
                $record
            );
        }
    }
}
