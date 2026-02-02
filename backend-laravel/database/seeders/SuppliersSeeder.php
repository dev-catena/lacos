<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SuppliersSeeder extends Seeder
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
    'user_id' => 26,
    'company_name' => 'Catena sistemas de informação',
    'company_type' => 'pessoa_juridica',
    'cnpj' => '48126659000115',
    'cpf' => NULL,
    'address' => 'Rua Cordisburgo',
    'address_number' => '23',
    'address_complement' => NULL,
    'neighborhood' => 'Santa Inês',
    'city' => 'Belo Horizonte',
    'state' => 'MG',
    'zip_code' => '31080150',
    'bank_name' => 'Banco do brasil',
    'bank_code' => '001',
    'agency' => '48879',
    'account' => '291315',
    'account_type' => 'checking',
    'account_holder_name' => 'Darley Wilson dias',
    'account_holder_document' => '71533028672',
    'pix_key' => '71533028672',
    'pix_key_type' => 'cpf',
    'stripe_account_id' => NULL,
    'stripe_onboarding_completed' => 0,
    'business_description' => 'Venda de Próteses e órteses',
    'website' => 'https://catenasystem.com.br',
    'instagram' => '@catena',
    'facebook' => NULL,
    'status' => 'approved',
    'approved_at' => '2026-02-01 16:24:50',
    'rejected_reason' => NULL,
    'created_at' => '2026-02-01 16:07:38',
    'updated_at' => '2026-02-01 23:38:21',
  ),
);

        foreach ($records as $record) {
            DB::table('suppliers')->updateOrInsert(
                ['id' => $record['id']],
                $record
            );
        }
    }
}
