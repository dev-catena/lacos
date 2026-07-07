<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ExternalApiClientSeeder extends Seeder
{
    public function run(): void
    {
        $key = env('MATERNIDADE_API_KEY', Str::random(48));

        DB::table('external_api_clients')->updateOrInsert(
            ['name' => 'App Maternidade'],
            [
                'api_key'    => $key,
                'is_active'  => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        $this->command->info('API key do App Maternidade: ' . $key);
    }
}
