<?php

use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Console Routes & Scheduled Tasks
|--------------------------------------------------------------------------
*/

// Verificar no-shows de teleconsultas: médico ou paciente não entrou entre 15 min antes e 40 min depois
// Médico ausente → reembolso ao paciente. Paciente ausente → libera ao médico.
Schedule::command('appointments:check-teleconsultation-no-shows')
    ->everyFifteenMinutes()
    ->withoutOverlapping(10);
