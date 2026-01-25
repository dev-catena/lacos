<?php

namespace App\Services;

use App\Models\Appointment;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

/**
 * Serviço para gerenciar pagamentos de teleconsultas
 * 
 * NOTA: Esta implementação usa MOCKUP quando não é possível integrar com gateway real
 */
class AppointmentPaymentService
{
    private $isMockMode = true; // MUDAR PARA false quando gateway real estiver configurado
    
    /**
     * Processar pagamento e colocar em hold
     */
    public function processPayment(Appointment $appointment, $amount, $paymentMethodData = [])
    {
        try {
            // Validar se é teleconsulta
            if (!$appointment->is_teleconsultation) {
                throw new \Exception('Apenas teleconsultas podem ser pagas');
            }
            
            // Validar status
            if ($appointment->payment_status === 'paid_held' || $appointment->payment_status === 'released') {
                throw new \Exception('Esta consulta já foi paga');
            }
            
            if ($this->isMockMode) {
                return $this->processPaymentMock($appointment, $amount, $paymentMethodData);
            }
            
            // TODO: Implementar integração real com gateway
            // return $this->processPaymentReal($appointment, $amount, $paymentMethodData);
            
        } catch (\Exception $e) {
            Log::error('Erro ao processar pagamento', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
    
    /**
     * MOCKUP: Processar pagamento (simulado)
     */
    private function processPaymentMock(Appointment $appointment, $amount, $paymentMethodData)
    {
        DB::beginTransaction();
        try {
            // Gerar IDs mock
            $paymentId = 'mock_pay_' . time() . '_' . $appointment->id;
            $holdId = 'mock_hold_' . time() . '_' . $appointment->id;
            
            // Atualizar appointment
            $appointment->update([
                'payment_status' => 'paid_held',
                'amount' => $amount,
                'payment_id' => $paymentId,
                'payment_hold_id' => $holdId,
                'paid_at' => now(),
                'held_at' => now(),
            ]);
            
            DB::commit();
            
            Log::info('Pagamento processado (MOCKUP)', [
                'appointment_id' => $appointment->id,
                'payment_id' => $paymentId,
                'hold_id' => $holdId,
                'amount' => $amount,
            ]);
            
            return [
                'success' => true,
                'payment_id' => $paymentId,
                'hold_id' => $holdId,
                'status' => 'paid_held',
                'amount' => $amount,
                'is_mock' => true,
            ];
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
    
    /**
     * Liberar pagamento e dividir valores
     */
    public function releasePayment(Appointment $appointment, $confirmedBy = 'patient')
    {
        try {
            // Validar status
            if ($appointment->payment_status !== 'paid_held') {
                throw new \Exception('Pagamento não está em hold');
            }
            
            if ($this->isMockMode) {
                return $this->releasePaymentMock($appointment, $confirmedBy);
            }
            
            // TODO: Implementar liberação real com gateway
            // return $this->releasePaymentReal($appointment, $confirmedBy);
            
        } catch (\Exception $e) {
            Log::error('Erro ao liberar pagamento', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
    
    /**
     * MOCKUP: Liberar pagamento (simulado)
     */
    private function releasePaymentMock(Appointment $appointment, $confirmedBy)
    {
        DB::beginTransaction();
        try {
            $amount = $appointment->amount ?? 0;
            $doctorAmount = $amount * 0.80; // 80% para médico
            $platformAmount = $amount * 0.20; // 20% para plataforma
            
            // Atualizar appointment
            $appointment->update([
                'payment_status' => 'released',
                'status' => 'completed',
                'doctor_amount' => $doctorAmount,
                'platform_amount' => $platformAmount,
                'released_at' => now(),
                'confirmed_at' => now(),
                'confirmed_by' => $confirmedBy,
            ]);
            
            DB::commit();
            
            Log::info('Pagamento liberado (MOCKUP)', [
                'appointment_id' => $appointment->id,
                'doctor_amount' => $doctorAmount,
                'platform_amount' => $platformAmount,
                'confirmed_by' => $confirmedBy,
            ]);
            
            return [
                'success' => true,
                'status' => 'released',
                'transfers' => [
                    [
                        'account' => 'doctor',
                        'amount' => $doctorAmount,
                        'transfer_id' => 'mock_trans_doctor_' . $appointment->id,
                    ],
                    [
                        'account' => 'platform',
                        'amount' => $platformAmount,
                        'transfer_id' => 'mock_trans_platform_' . $appointment->id,
                    ],
                ],
                'is_mock' => true,
            ];
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
    
    /**
     * Reembolsar pagamento
     */
    public function refundPayment(Appointment $appointment, $cancelledBy, $reason = null)
    {
        try {
            // Validar status
            if ($appointment->payment_status !== 'paid_held') {
                throw new \Exception('Pagamento não está em hold para reembolso');
            }
            
            if ($this->isMockMode) {
                return $this->refundPaymentMock($appointment, $cancelledBy, $reason);
            }
            
            // TODO: Implementar reembolso real com gateway
            // return $this->refundPaymentReal($appointment, $cancelledBy, $reason);
            
        } catch (\Exception $e) {
            Log::error('Erro ao reembolsar pagamento', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }
    
    /**
     * MOCKUP: Reembolsar pagamento (simulado)
     */
    private function refundPaymentMock(Appointment $appointment, $cancelledBy, $reason)
    {
        DB::beginTransaction();
        try {
            $refundId = 'mock_refund_' . time() . '_' . $appointment->id;
            $amount = $appointment->amount ?? 0;
            
            // Atualizar appointment
            $appointment->update([
                'payment_status' => 'refunded',
                'status' => 'cancelled',
                'refund_id' => $refundId,
                'refunded_at' => now(),
                'cancelled_at' => now(),
                'cancelled_by' => $cancelledBy,
            ]);
            
            DB::commit();
            
            Log::info('Pagamento reembolsado (MOCKUP)', [
                'appointment_id' => $appointment->id,
                'refund_id' => $refundId,
                'amount' => $amount,
                'cancelled_by' => $cancelledBy,
            ]);
            
            return [
                'success' => true,
                'refund_id' => $refundId,
                'refund_amount' => $amount,
                'status' => 'refunded',
                'is_mock' => true,
            ];
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
    
    /**
     * Verificar se médico entrou na videoconsulta
     */
    public function checkDoctorJoinedVideoCall(Appointment $appointment)
    {
        // TODO: Implementar verificação real via WebSocket ou logs de vídeo
        // Por enquanto, retorna true (mock)
        return true;
    }
    
    /**
     * Verificar se paciente entrou na videoconsulta
     */
    public function checkPatientJoinedVideoCall(Appointment $appointment)
    {
        // TODO: Implementar verificação real via WebSocket ou logs de vídeo
        // Por enquanto, retorna true (mock)
        return true;
    }
    
    /**
     * Verificar consultas com 6 horas decorridas e liberar automaticamente
     */
    public function autoReleaseAfter6Hours()
    {
        $appointments = Appointment::where('status', 'scheduled')
            ->where('payment_status', 'paid_held')
            ->where('scheduled_at', '<=', now()->subHours(6))
            ->get();
        
        $released = 0;
        foreach ($appointments as $appointment) {
            try {
                $this->releasePayment($appointment, 'system_auto');
                $released++;
            } catch (\Exception $e) {
                Log::error('Erro ao liberar pagamento automático', [
                    'appointment_id' => $appointment->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
        
        return $released;
    }
    
    /**
     * Verificar ausência de médico na videoconsulta
     */
    public function checkDoctorAbsence()
    {
        $now = now();
        $appointments = Appointment::where('status', 'scheduled')
            ->where('payment_status', 'paid_held')
            ->where('scheduled_at', '>=', $now->copy()->subMinutes(40))
            ->where('scheduled_at', '<=', $now->copy()->addMinutes(15))
            ->get();
        
        $refunded = 0;
        foreach ($appointments as $appointment) {
            $scheduledAt = \Carbon\Carbon::parse($appointment->scheduled_at);
            $startWindow = $scheduledAt->copy()->subMinutes(15);
            $endWindow = $scheduledAt->copy()->addMinutes(40);
            
            if ($now->between($startWindow, $endWindow)) {
                if (!$this->checkDoctorJoinedVideoCall($appointment)) {
                    try {
                        $this->refundPayment($appointment, 'system_doctor_absence', 'Médico não entrou na videoconsulta');
                        $refunded++;
                    } catch (\Exception $e) {
                        Log::error('Erro ao reembolsar por ausência de médico', [
                            'appointment_id' => $appointment->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            }
        }
        
        return $refunded;
    }
    
    /**
     * Verificar ausência de paciente na videoconsulta
     */
    public function checkPatientAbsence()
    {
        $now = now();
        $appointments = Appointment::where('status', 'scheduled')
            ->where('payment_status', 'paid_held')
            ->where('scheduled_at', '>=', $now->copy()->subMinutes(40))
            ->where('scheduled_at', '<=', $now->copy()->addMinutes(15))
            ->get();
        
        $released = 0;
        foreach ($appointments as $appointment) {
            $scheduledAt = \Carbon\Carbon::parse($appointment->scheduled_at);
            $startWindow = $scheduledAt->copy()->subMinutes(15);
            $endWindow = $scheduledAt->copy()->addMinutes(40);
            
            if ($now->between($startWindow, $endWindow)) {
                if (!$this->checkPatientJoinedVideoCall($appointment)) {
                    try {
                        $this->releasePayment($appointment, 'system_patient_absence');
                        $released++;
                    } catch (\Exception $e) {
                        Log::error('Erro ao liberar pagamento por ausência de paciente', [
                            'appointment_id' => $appointment->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            }
        }
        
        return $released;
    }
}

