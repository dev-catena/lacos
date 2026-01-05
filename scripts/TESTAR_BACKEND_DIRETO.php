<?php

require __DIR__ . '/../backend-laravel/vendor/autoload.php';

$app = require_once __DIR__ . '/../backend-laravel/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Testando Backend Diretamente ===\n\n";

// Simular uma requisição
$groupId = 1; // Ajuste conforme necessário

// Buscar medicamentos como o controller faz
$medications = DB::table('medications')
    ->leftJoin('doctors', 'medications.doctor_id', '=', 'doctors.id')
    ->where('medications.group_id', $groupId)
    ->whereNotNull('medications.doctor_id')
    ->select('medications.*', 'doctors.id as doctor_id', 'doctors.name as doctor_name', 'doctors.medical_specialty_id')
    ->limit(5)
    ->get();

echo "Medicamentos encontrados: " . $medications->count() . "\n\n";

foreach ($medications as $med) {
    echo "Medicamento ID: {$med->id}, Nome: {$med->name}\n";
    echo "  Doctor ID: {$med->doctor_id}, Nome: {$med->doctor_name}\n";
    echo "  Medical Specialty ID: " . ($med->medical_specialty_id ?? 'NULL') . "\n";
    
    if ($med->doctor_name && stripos($med->doctor_name, 'Ariadna') !== false) {
        echo "  *** ARIADNA ENCONTRADA ***\n";
        
        if ($med->medical_specialty_id) {
            $specialty = DB::table('medical_specialties')
                ->where('id', $med->medical_specialty_id)
                ->select('id', 'name')
                ->first();
            
            if ($specialty) {
                echo "  Especialidade encontrada: ID={$specialty->id}, Nome={$specialty->name}\n";
            } else {
                echo "  ⚠️ Especialidade NÃO encontrada no banco para ID {$med->medical_specialty_id}\n";
            }
        } else {
            echo "  ⚠️ Ariadna NÃO tem medical_specialty_id\n";
        }
    }
    echo "\n";
}

echo "\n=== Teste concluído ===\n";





