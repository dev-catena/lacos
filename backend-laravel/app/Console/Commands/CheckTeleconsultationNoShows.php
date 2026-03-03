<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Services\AppointmentPaymentService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class CheckTeleconsultationNoShows extends Command
{
    protected $signature = 'appointments:check-teleconsultation-no-shows';

    protected $description = 'Verifica no-shows de teleconsultas: médico ou paciente não entrou entre 15 min antes e 40 min depois. Médico ausente → reembolso. Paciente ausente → libera ao médico.';

    public function handle(AppointmentPaymentService $paymentService)
    {
        if (!Schema::hasColumn('appointments', 'doctor_joined_at')) {
            $this->warn('Coluna doctor_joined_at não existe. Execute as migrations.');
            return 0;
        }

        $this->info('Verificando no-shows de teleconsultas...');

        $now = Carbon::now();
        $cutoff = $now->copy()->subMinutes(40);

        $appointments = Appointment::where('is_teleconsultation', true)
            ->where('payment_status', 'paid_held')
            ->where('status', '!=', 'cancelled')
            ->where(function ($q) use ($cutoff) {
                $q->where('scheduled_at', '<=', $cutoff)
                    ->orWhereRaw('COALESCE(scheduled_at, appointment_date) <= ?', [$cutoff]);
            })
            ->get();

        $doctorAbsenceCount = 0;
        $patientAbsenceCount = 0;

        foreach ($appointments as $appointment) {
            $scheduledAt = $appointment->scheduled_at ?? $appointment->appointment_date;
            if (!$scheduledAt) {
                continue;
            }

            $windowEnd = Carbon::parse($scheduledAt)->addMinutes(40);
            if ($now->lt($windowEnd)) {
                continue;
            }

            $doctorJoined = $appointment->doctor_joined_at !== null;
            $patientJoined = $appointment->patient_joined_at !== null;

            if (!$doctorJoined) {
                try {
                    $result = $paymentService->handleDoctorAbsence($appointment);
                    if ($result['success']) {
                        $doctorAbsenceCount++;
                        $this->info("  Reembolso: médico não entrou - appointment #{$appointment->id}");
                        Log::info('CheckTeleconsultationNoShows - Reembolso por ausência do médico', [
                            'appointment_id' => $appointment->id,
                        ]);
                    } else {
                        $this->error("  Erro ao reembolsar appointment #{$appointment->id}: {$result['message']}");
                    }
                } catch (\Exception $e) {
                    Log::error('CheckTeleconsultationNoShows - Erro ao processar ausência do médico', [
                        'appointment_id' => $appointment->id,
                        'error' => $e->getMessage(),
                    ]);
                    $this->error("  Exceção appointment #{$appointment->id}: {$e->getMessage()}");
                }
            } elseif (!$patientJoined) {
                try {
                    $result = $paymentService->handlePatientAbsence($appointment);
                    if ($result['success']) {
                        $patientAbsenceCount++;
                        $this->info("  Liberado ao médico: paciente não entrou - appointment #{$appointment->id}");
                        Log::info('CheckTeleconsultationNoShows - Liberado por ausência do paciente', [
                            'appointment_id' => $appointment->id,
                        ]);
                    } else {
                        $this->error("  Erro ao liberar appointment #{$appointment->id}: {$result['message']}");
                    }
                } catch (\Exception $e) {
                    Log::error('CheckTeleconsultationNoShows - Erro ao processar ausência do paciente', [
                        'appointment_id' => $appointment->id,
                        'error' => $e->getMessage(),
                    ]);
                    $this->error("  Exceção appointment #{$appointment->id}: {$e->getMessage()}");
                }
            }
        }

        $this->info("Concluído. Reembolsos (médico ausente): {$doctorAbsenceCount}. Liberados (paciente ausente): {$patientAbsenceCount}.");

        return 0;
    }
}
