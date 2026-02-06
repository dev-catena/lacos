<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

/**
 * [MOCK] PaymentService - Serviço mock para integração com gateway de pagamento
 * 
 * Este serviço simula a integração com um gateway de pagamento real.
 * Em produção, este serviço deve ser substituído pela integração real.
 * 
 * TAG: [MOCK]
 */
class PaymentService
{
    /**
     * Criar pagamento e colocar em hold
     * 
     * @param float $amount Valor do pagamento
     * @param string $currency Moeda (padrão: BRL)
     * @param string $description Descrição do pagamento
     * @param string $customerId ID do cliente
     * @param array $splitConfig Configuração de divisão (80% médico, 20% plataforma)
     * @return array
     */
    public function createPaymentWithHold(float $amount, string $currency = 'BRL', string $description = '', string $customerId = '', array $splitConfig = []): array
    {
        Log::info('[MOCK] PaymentService.createPaymentWithHold', [
            'amount' => $amount,
            'currency' => $currency,
            'description' => $description,
            'customer_id' => $customerId,
        ]);

        // Simular delay de processamento
        usleep(500000); // 0.5 segundos

        // Gerar IDs mock
        $paymentId = 'pay_mock_' . uniqid();
        $holdId = 'hold_mock_' . uniqid();

        return [
            'success' => true,
            'payment_id' => $paymentId,
            'hold_id' => $holdId,
            'status' => 'held',
            'amount' => $amount,
            'currency' => $currency,
            'held_until' => now()->addDays(7)->toIso8601String(),
            'created_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Liberar hold e processar divisão
     * 
     * @param string $holdId ID do hold
     * @param float $amount Valor total
     * @param array $splitConfig Configuração de divisão
     * @return array
     */
    public function releaseHold(string $holdId, float $amount, array $splitConfig = []): array
    {
        Log::info('[MOCK] PaymentService.releaseHold', [
            'hold_id' => $holdId,
            'amount' => $amount,
        ]);

        // Simular delay de processamento
        usleep(500000); // 0.5 segundos

        // Calcular divisão padrão: 80% médico, 20% plataforma
        $doctorPercentage = $splitConfig['doctor_percentage'] ?? 80;
        $platformPercentage = $splitConfig['platform_percentage'] ?? 20;

        $doctorAmount = round($amount * ($doctorPercentage / 100), 2);
        $platformAmount = round($amount * ($platformPercentage / 100), 2);

        return [
            'success' => true,
            'hold_id' => $holdId,
            'status' => 'released',
            'transfers' => [
                [
                    'transfer_id' => 'trans_doctor_mock_' . uniqid(),
                    'account_id' => $splitConfig['doctor_account_id'] ?? 'doctor_account_mock',
                    'amount' => $doctorAmount,
                    'status' => 'completed',
                ],
                [
                    'transfer_id' => 'trans_platform_mock_' . uniqid(),
                    'account_id' => $splitConfig['platform_account_id'] ?? 'platform_account_mock',
                    'amount' => $platformAmount,
                    'status' => 'completed',
                ],
            ],
            'released_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Cancelar hold e reembolsar
     * 
     * @param string $holdId ID do hold
     * @param float $amount Valor a reembolsar
     * @return array
     */
    public function cancelHoldAndRefund(string $holdId, float $amount): array
    {
        Log::info('[MOCK] PaymentService.cancelHoldAndRefund', [
            'hold_id' => $holdId,
            'amount' => $amount,
        ]);

        // Simular delay de processamento
        usleep(500000); // 0.5 segundos

        $refundId = 'refund_mock_' . uniqid();

        return [
            'success' => true,
            'hold_id' => $holdId,
            'status' => 'cancelled',
            'refund_id' => $refundId,
            'refund_amount' => $amount,
            'refund_status' => 'processing',
            'refunded_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Verificar status do pagamento
     * 
     * @param string $paymentId ID do pagamento
     * @return array
     */
    public function getPaymentStatus(string $paymentId): array
    {
        Log::info('[MOCK] PaymentService.getPaymentStatus', [
            'payment_id' => $paymentId,
        ]);

        return [
            'success' => true,
            'payment_id' => $paymentId,
            'status' => 'held',
            'hold_status' => 'active',
            'created_at' => now()->subHours(1)->toIso8601String(),
        ];
    }
}




