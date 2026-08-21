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

// Alertas de vacinação: vacinas próximas (7 dias) e atrasadas
Schedule::command('vaccinations:check-alerts')
    ->dailyAt('08:00')
    ->withoutOverlapping(5);

// Lembretes de compromissos (24h, 3h, 1h, 15min — conforme reminder_times do agendamento)
Schedule::command('notifications:check-appointments')
    ->everyMinute()
    ->withoutOverlapping(2);

// Alertas SOS do smartwatch (Thalamus) → panic_events + notificações
Schedule::command('panic:sync-watch-sos')
    ->everyMinute()
    ->withoutOverlapping(2);

// Basal diária: média de até 8 amostras (janelas de 3h) do dia anterior
Schedule::command('vitals:compute-daily-basals')
    ->dailyAt('00:15')
    ->withoutOverlapping(30);

// Backup: desvio ≥50% da basal → notificação aos membros do grupo
Schedule::command('notifications:check-vital-signs')
    ->everyFifteenMinutes()
    ->withoutOverlapping(10);
