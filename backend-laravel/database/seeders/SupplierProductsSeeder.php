<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SupplierProductsSeeder extends Seeder
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
    'supplier_id' => 1,
    'name' => 'Muleta Axilar',
    'description' => 'Muleta Axilar Par SC60 Tamanho M Suporta 130kg Hidrolight',
    'price' => '300.00',
    'stock' => 12,
    'category' => 'Dispositivos de Segurança',
    'image_url' => 'http://10.102.0.103:8000/storage/products/N4rtWR10tYAeij9uUEyrkFiqW4wyz9v8afxCxAyW.png',
    'images' => '["http://10.102.0.103:8000/storage/products/N4rtWR10tYAeij9uUEyrkFiqW4wyz9v8afxCxAyW.png"]',
    'payment_methods' => null,
    'delivery_methods' => null,
    'delivery_fee' => null,
    'delivery_days' => null,
    'free_delivery_above' => null,
    'free_delivery_threshold' => null,
    'weight' => null,
    'length' => null,
    'width' => null,
    'height' => null,
    'is_active' => 1,
    'created_at' => '2026-02-01 16:30:27',
    'updated_at' => '2026-02-01 16:30:27',
  ),
);

        foreach ($records as $record) {
            DB::table('supplier_products')->updateOrInsert(
                ['id' => $record['id']],
                $record
            );
        }
    }
}
