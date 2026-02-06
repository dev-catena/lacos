<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

/**
 * AppointmentPaymentService - Lógica de negócio para pagamento de consultas
 */
class AppointmentPaymentService
{
    protected $paymentService;

    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    /**
     * Processar pagamento de uma consulta
     * 
     * @param Appointment $appointment
     * @param array $paymentData Dados do pagamento (payment_method, card_token, etc)
     * @return array
     */
    public function processPayment(Appointment $appointment, array $paymentData): array
    {
        try {
            // Validar se consulta pode ser paga
            if ($appointment->payment_status !== 'pending') {
                return [
                    'success' => false,
                    'message' => 'Esta consulta já foi paga ou não está pendente de pagamento.',
                ];
            }

            // Validar se é teleconsulta
            if (!$appointment->is_teleconsultation) {
                return [
                    'success' => false,
                    'message' => 'Apenas teleconsultas requerem pagamento.',
                ];
            }

            // Obter valor da consulta (já deve incluir a taxa de 20% da plataforma)
            $amount = $appointment->amount;
            if (!$amount) {
                // Buscar valor do médico e calcular total
                $doctor = $appointment->doctorUser;
                $consultationPrice = null;
                
                if ($doctor && isset($doctor->consultation_price)) {
                    $consultationPrice = $doctor->consultation_price;
                } else {
                    $consultationPrice = 100.00; // Valor padrão
                }
                
                // Calcular valor total: consultation_price + 20% (taxa da plataforma)
                $amount = round($consultationPrice * 1.20, 2);
            }

            // Criar pagamento no gateway (mock)
            $description = "Teleconsulta - {$appointment->title}";
            $customerId = auth()->id();

            $paymentResult = $this->paymentService->createPaymentWithHold(
                $amount,
                'BRL',
                $description,
                $customerId,
                [
                    'doctor_percentage' => 80,
                    'platform_percentage' => 20,
                    'doctor_account_id' => $this->getDoctorAccountId($appointment->doctor_id),
                    'platform_account_id' => $this->getPlatformAccountId(),
                ]
            );

            if (!$paymentResult['success']) {
                return [
                    'success' => false,
                    'message' => 'Erro ao processar pagamento no gateway.',
                ];
            }

            // Atualizar appointment
            $appointment->update([
                'payment_status' => 'paid_held',
                'amount' => $amount,
                'payment_id' => $paymentResult['payment_id'],
                'payment_hold_id' => $paymentResult['hold_id'],
                'paid_at' => now(),
                'held_at' => now(),
            ]);

            Log::info('AppointmentPaymentService.processPayment - Pagamento processado', [
                'appointment_id' => $appointment->id,
                'payment_id' => $paymentResult['payment_id'],
                'hold_id' => $paymentResult['hold_id'],
                'amount' => $amount,
            ]);

            return [
                'success' => true,
                'appointment_id' => $appointment->id,
                'payment_id' => $paymentResult['payment_id'],
                'hold_id' => $paymentResult['hold_id'],
                'status' => 'paid_held',
                'amount' => $amount,
                'message' => 'Pagamento processado e valor mantido em hold',
            ];
        } catch (\Exception $e) {
            Log::error('AppointmentPaymentService.processPayment - Erro', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'message' => 'Erro ao processar pagamento: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Confirmar consulta realizada e liberar pagamento
     * 
     * @param Appointment $appointment
     * @param string $confirmedBy Quem confirmou (patient, system_auto, etc)
     * @return array
     */
    public function confirmAndRelease(Appointment $appointment, string $confirmedBy = 'patient'): array
    {
        try {
            // Validar se pagamento está em hold
            if ($appointment->payment_status !== 'paid_held') {
                return [
                    'success' => false,
                    'message' => 'Pagamento não está em hold para ser liberado.',
                ];
            }

            // Calcular valores antes de liberar
            // O amount já inclui a taxa de 20%, então:
            // amount = consultation_price * 1.20
            // Para obter o valor original: amount / 1.20
            $originalPrice = round($appointment->amount / 1.20, 2);
            $doctorAmount = $originalPrice;
            $platformAmount = round($appointment->amount - $originalPrice, 2);
            
            // Calcular percentuais para o gateway
            // O gateway divide baseado em percentuais do valor total
            $doctorPercentage = round(($doctorAmount / $appointment->amount) * 100, 2);
            $platformPercentage = round(($platformAmount / $appointment->amount) * 100, 2);
            
            // Liberar hold no gateway
            $releaseResult = $this->paymentService->releaseHold(
                $appointment->payment_hold_id,
                $appointment->amount,
                [
                    'doctor_percentage' => $doctorPercentage,
                    'platform_percentage' => $platformPercentage,
                    'doctor_account_id' => $this->getDoctorAccountId($appointment->doctor_id),
                    'platform_account_id' => $this->getPlatformAccountId(),
                ]
            );

            if (!$releaseResult['success']) {
                return [
                    'success' => false,
                    'message' => 'Erro ao liberar pagamento no gateway.',
                ];
            }

            // Valores já foram calculados acima antes de liberar o hold

            // Atualizar appointment
            $appointment->update([
                'status' => 'concluida',
                'payment_status' => 'released',
                'confirmed_by' => $confirmedBy,
                'confirmed_at' => now(),
                'released_at' => now(),
                'doctor_amount' => $doctorAmount,
                'platform_amount' => $platformAmount,
            ]);

            Log::info('AppointmentPaymentService.confirmAndRelease - Pagamento liberado', [
                'appointment_id' => $appointment->id,
                'confirmed_by' => $confirmedBy,
                'doctor_amount' => $doctorAmount,
                'platform_amount' => $platformAmount,
            ]);

            return [
                'success' => true,
                'appointment_id' => $appointment->id,
                'status' => 'concluida',
                'payment_status' => 'released',
                'transfers' => $releaseResult['transfers'],
                'doctor_amount' => $doctorAmount,
                'platform_amount' => $platformAmount,
            ];
        } catch (\Exception $e) {
            Log::error('AppointmentPaymentService.confirmAndRelease - Erro', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Erro ao liberar pagamento: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Cancelar consulta e reembolsar
     * 
     * @param Appointment $appointment
     * @param string $cancelledBy Quem cancelou
     * @return array
     */
    public function cancelAndRefund(Appointment $appointment, string $cancelledBy = 'doctor'): array
    {
        try {
            // Validar se pagamento está em hold
            if ($appointment->payment_status !== 'paid_held') {
                return [
                    'success' => false,
                    'message' => 'Pagamento não está em hold para ser reembolsado.',
                ];
            }

            // Cancelar hold e reembolsar no gateway
            $refundResult = $this->paymentService->cancelHoldAndRefund(
                $appointment->payment_hold_id,
                $appointment->amount
            );

            if (!$refundResult['success']) {
                return [
                    'success' => false,
                    'message' => 'Erro ao processar reembolso no gateway.',
                ];
            }

            // Atualizar appointment
            $appointment->update([
                'status' => 'cancelled',
                'payment_status' => 'refunded',
                'cancelled_by' => $cancelledBy,
                'refund_id' => $refundResult['refund_id'],
                'refunded_at' => now(),
            ]);

            Log::info('AppointmentPaymentService.cancelAndRefund - Reembolso processado', [
                'appointment_id' => $appointment->id,
                'cancelled_by' => $cancelledBy,
                'refund_id' => $refundResult['refund_id'],
            ]);

            return [
                'success' => true,
                'appointment_id' => $appointment->id,
                'status' => 'cancelled',
                'payment_status' => 'refunded',
                'refund_id' => $refundResult['refund_id'],
                'refund_amount' => $appointment->amount,
            ];
        } catch (\Exception $e) {
            Log::error('AppointmentPaymentService.cancelAndRefund - Erro', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Erro ao processar reembolso: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Obter ID da conta do médico no gateway
     */
    protected function getDoctorAccountId($doctorId): string
    {
        // Em produção, buscar da tabela de médicos
        return 'doctor_account_' . $doctorId;
    }

    /**
     * Obter ID da conta da plataforma no gateway
     */
    protected function getPlatformAccountId(): string
    {
        return 'platform_account_lacos';
    }
}





