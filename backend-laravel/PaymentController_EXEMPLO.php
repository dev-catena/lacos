<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use Stripe\PaymentMethod;
use Stripe\Exception\ApiErrorException;

/**
 * Controller de Pagamentos com Stripe
 * 
 * IMPORTANTE: 
 * - Instale o Stripe SDK: composer require stripe/stripe-php
 * - Configure as variáveis de ambiente no .env
 * - Adicione as rotas em routes/api.php
 */
class PaymentController extends Controller
{
    public function __construct()
    {
        // Configurar chave secreta do Stripe
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    /**
     * Criar Payment Intent
     * 
     * POST /api/payments/create-intent
     * 
     * Body:
     * {
     *   "appointment_id": 123,
     *   "amount": 18000,  // em centavos (R$ 180,00)
     *   "installments": 1
     * }
     */
    public function createIntent(Request $request)
    {
        $validated = $request->validate([
            'appointment_id' => 'required|exists:appointments,id',
            'amount' => 'required|numeric|min:50', // Mínimo R$ 0,50
            'installments' => 'sometimes|integer|min:1|max:12',
        ]);

        try {
            $appointment = Appointment::findOrFail($validated['appointment_id']);
            $user = Auth::user();

            // Verificar se o appointment pertence ao usuário ou grupo do usuário
            if ($appointment->group_id && !$user->groups->contains('id', $appointment->group_id)) {
                return response()->json([
                    'message' => 'Você não tem permissão para pagar este compromisso'
                ], 403);
            }

            // Verificar se já foi pago
            if ($appointment->payment_status === 'paid') {
                return response()->json([
                    'message' => 'Este compromisso já foi pago'
                ], 400);
            }

            // Criar Payment Intent no Stripe
            $paymentIntent = PaymentIntent::create([
                'amount' => $validated['amount'], // Já vem em centavos
                'currency' => 'brl',
                'payment_method_types' => ['card'],
                'metadata' => [
                    'appointment_id' => $appointment->id,
                    'user_id' => $user->id,
                    'group_id' => $appointment->group_id,
                    'installments' => $validated['installments'] ?? 1,
                ],
            ]);

            Log::info('Payment Intent criado', [
                'payment_intent_id' => $paymentIntent->id,
                'appointment_id' => $appointment->id,
                'user_id' => $user->id,
                'amount' => $validated['amount'],
            ]);

            return response()->json([
                'client_secret' => $paymentIntent->client_secret,
                'payment_intent_id' => $paymentIntent->id,
            ]);
        } catch (ApiErrorException $e) {
            Log::error('Erro ao criar Payment Intent', [
                'error' => $e->getMessage(),
                'appointment_id' => $validated['appointment_id'] ?? null,
            ]);

            return response()->json([
                'message' => 'Erro ao criar Payment Intent: ' . $e->getMessage()
            ], 400);
        } catch (\Exception $e) {
            Log::error('Erro inesperado ao criar Payment Intent', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Erro ao processar solicitação'
            ], 500);
        }
    }

    /**
     * Confirmar pagamento
     * 
     * POST /api/payments/confirm
     * 
     * Body:
     * {
     *   "payment_intent_id": "pi_...",
     *   "card_number": "4242424242424242",
     *   "card_name": "JOAO SILVA",
     *   "card_expiry": "1225",
     *   "card_cvv": "123",
     *   "installments": 1
     * }
     */
    public function confirm(Request $request)
    {
        $validated = $request->validate([
            'payment_intent_id' => 'required|string',
            'card_number' => 'required|string|regex:/^\d{13,19}$/',
            'card_name' => 'required|string|max:255',
            'card_expiry' => 'required|string|regex:/^\d{4}$/',
            'card_cvv' => 'required|string|regex:/^\d{3,4}$/',
            'installments' => 'sometimes|integer|min:1|max:12',
        ]);

        try {
            $user = Auth::user();

            // Recuperar Payment Intent
            $paymentIntent = PaymentIntent::retrieve($validated['payment_intent_id']);

            // Verificar se já foi confirmado
            if ($paymentIntent->status === 'succeeded') {
                return response()->json([
                    'success' => true,
                    'payment_id' => $paymentIntent->id,
                    'status' => $paymentIntent->status,
                    'message' => 'Pagamento já foi processado',
                ]);
            }

            // Extrair mês e ano da validade
            $expMonth = substr($validated['card_expiry'], 0, 2);
            $expYear = '20' . substr($validated['card_expiry'], 2, 2);

            // Criar Payment Method
            $paymentMethod = PaymentMethod::create([
                'type' => 'card',
                'card' => [
                    'number' => $validated['card_number'],
                    'exp_month' => (int) $expMonth,
                    'exp_year' => (int) $expYear,
                    'cvc' => $validated['card_cvv'],
                ],
                'billing_details' => [
                    'name' => $validated['card_name'],
                ],
            ]);

            // Confirmar Payment Intent
            $paymentIntent->confirm([
                'payment_method' => $paymentMethod->id,
            ]);

            // Verificar status
            if ($paymentIntent->status === 'succeeded') {
                // Atualizar appointment como pago
                $appointment = Appointment::findOrFail($paymentIntent->metadata->appointment_id);
                $appointment->update([
                    'payment_status' => 'paid',
                    'payment_intent_id' => $paymentIntent->id,
                    'paid_at' => now(),
                ]);

                Log::info('Pagamento confirmado com sucesso', [
                    'payment_intent_id' => $paymentIntent->id,
                    'appointment_id' => $appointment->id,
                    'user_id' => $user->id,
                    'amount' => $paymentIntent->amount,
                ]);

                return response()->json([
                    'success' => true,
                    'payment_id' => $paymentIntent->id,
                    'status' => $paymentIntent->status,
                    'message' => 'Pagamento processado com sucesso',
                ]);
            }

            Log::warning('Pagamento não confirmado', [
                'payment_intent_id' => $paymentIntent->id,
                'status' => $paymentIntent->status,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Pagamento não foi confirmado',
                'status' => $paymentIntent->status,
            ], 400);

        } catch (ApiErrorException $e) {
            Log::error('Erro ao processar pagamento', [
                'error' => $e->getMessage(),
                'stripe_code' => $e->getStripeCode(),
                'payment_intent_id' => $validated['payment_intent_id'] ?? null,
            ]);

            // Mensagens de erro mais amigáveis
            $errorMessage = 'Erro ao processar pagamento';
            $stripeCode = $e->getStripeCode();

            switch ($stripeCode) {
                case 'card_declined':
                    $errorMessage = 'Cartão recusado. Verifique os dados ou entre em contato com seu banco.';
                    break;
                case 'insufficient_funds':
                    $errorMessage = 'Saldo insuficiente. Verifique sua conta.';
                    break;
                case 'expired_card':
                    $errorMessage = 'Cartão expirado. Use outro cartão.';
                    break;
                case 'incorrect_cvc':
                    $errorMessage = 'CVV incorreto. Verifique os dados do cartão.';
                    break;
                case 'processing_error':
                    $errorMessage = 'Erro ao processar pagamento. Tente novamente.';
                    break;
            }

            return response()->json([
                'success' => false,
                'message' => $errorMessage,
                'error_code' => $stripeCode,
            ], 400);
        } catch (\Exception $e) {
            Log::error('Erro inesperado ao confirmar pagamento', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erro ao processar solicitação'
            ], 500);
        }
    }

    /**
     * Verificar status do pagamento
     * 
     * GET /api/payments/status/{paymentIntentId}
     */
    public function checkStatus($paymentIntentId)
    {
        try {
            $paymentIntent = PaymentIntent::retrieve($paymentIntentId);
            
            return response()->json([
                'status' => $paymentIntent->status,
                'payment_id' => $paymentIntent->id,
                'amount' => $paymentIntent->amount,
                'currency' => $paymentIntent->currency,
            ]);
        } catch (ApiErrorException $e) {
            Log::error('Erro ao verificar status do pagamento', [
                'error' => $e->getMessage(),
                'payment_intent_id' => $paymentIntentId,
            ]);

            return response()->json([
                'message' => 'Erro ao verificar status: ' . $e->getMessage()
            ], 400);
        }
    }
}

