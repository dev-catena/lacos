# 💳 Configuração do Stripe para Pagamentos

Este guia explica como configurar o Stripe para processar pagamentos na tela de pagamento de teleconsultas.

## 📋 Pré-requisitos

1. Conta no Stripe (https://stripe.com)
2. Backend Laravel configurado
3. Chaves da API do Stripe (pública e secreta)

## 🔑 Passo 1: Obter Chaves da API Stripe

1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com/)
2. Vá em **Developers** → **API keys**
3. Copie a **Publishable key** (chave pública - pode estar no frontend)
4. Copie a **Secret key** (chave secreta - apenas no backend)

### Chaves de Teste vs Produção

- **Teste**: Comece com chaves de teste (`pk_test_...` e `sk_test_...`)
- **Produção**: Use chaves de produção (`pk_live_...` e `sk_live_...`) apenas quando estiver pronto

## 📱 Passo 2: Configurar Frontend (React Native)

### 2.1. Configurar Variável de Ambiente

Crie ou edite o arquivo `.env` na raiz do projeto:

```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_aqui
```

### 2.2. Atualizar Configuração

Edite `src/config/stripe.js` e verifique se a chave está sendo carregada:

```javascript
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_...';
```

**⚠️ IMPORTANTE**: A chave pública pode estar no frontend, mas a chave secreta NUNCA deve estar no frontend!

## 🖥️ Passo 3: Configurar Backend (Laravel)

### 3.1. Instalar SDK do Stripe

No servidor, execute:

```bash
cd /var/www/lacos-backend
composer require stripe/stripe-php
```

### 3.2. Configurar Variáveis de Ambiente

Edite o arquivo `.env` do Laravel:

```env
STRIPE_KEY=pk_test_sua_chave_publica
STRIPE_SECRET=sk_test_sua_chave_secreta
STRIPE_WEBHOOK_SECRET=whsec_sua_chave_webhook
```

### 3.3. Criar Controller de Pagamentos

Crie o arquivo `app/Http/Controllers/Api/PaymentController.php`:

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use Stripe\Exception\ApiErrorException;

class PaymentController extends Controller
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    /**
     * Criar Payment Intent
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
            
            // Verificar se o appointment pertence ao usuário ou grupo do usuário
            $user = Auth::user();
            if ($appointment->group_id && !$user->groups->contains($appointment->group_id)) {
                return response()->json([
                    'message' => 'Você não tem permissão para pagar este compromisso'
                ], 403);
            }

            // Criar Payment Intent no Stripe
            $paymentIntent = PaymentIntent::create([
                'amount' => $validated['amount'], // Já vem em centavos
                'currency' => 'brl',
                'payment_method_types' => ['card'],
                'metadata' => [
                    'appointment_id' => $appointment->id,
                    'user_id' => $user->id,
                    'installments' => $validated['installments'] ?? 1,
                ],
            ]);

            return response()->json([
                'client_secret' => $paymentIntent->client_secret,
                'payment_intent_id' => $paymentIntent->id,
            ]);
        } catch (ApiErrorException $e) {
            return response()->json([
                'message' => 'Erro ao criar Payment Intent: ' . $e->getMessage()
            ], 400);
        }
    }

    /**
     * Confirmar pagamento
     */
    public function confirm(Request $request)
    {
        $validated = $request->validate([
            'payment_intent_id' => 'required|string',
            'card_number' => 'required|string|size:16',
            'card_name' => 'required|string|max:255',
            'card_expiry' => 'required|string|size:4',
            'card_cvv' => 'required|string|size:3',
            'installments' => 'sometimes|integer|min:1|max:12',
        ]);

        try {
            $paymentIntent = PaymentIntent::retrieve($validated['payment_intent_id']);

            // Criar Payment Method
            $paymentMethod = \Stripe\PaymentMethod::create([
                'type' => 'card',
                'card' => [
                    'number' => $validated['card_number'],
                    'exp_month' => substr($validated['card_expiry'], 0, 2),
                    'exp_year' => '20' . substr($validated['card_expiry'], 2, 2),
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

                return response()->json([
                    'success' => true,
                    'payment_id' => $paymentIntent->id,
                    'status' => $paymentIntent->status,
                    'message' => 'Pagamento processado com sucesso',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Pagamento não foi confirmado',
                'status' => $paymentIntent->status,
            ], 400);

        } catch (ApiErrorException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao processar pagamento: ' . $e->getMessage(),
                'error_code' => $e->getStripeCode(),
            ], 400);
        }
    }

    /**
     * Verificar status do pagamento
     */
    public function checkStatus($paymentIntentId)
    {
        try {
            $paymentIntent = PaymentIntent::retrieve($paymentIntentId);
            
            return response()->json([
                'status' => $paymentIntent->status,
                'payment_id' => $paymentIntent->id,
            ]);
        } catch (ApiErrorException $e) {
            return response()->json([
                'message' => 'Erro ao verificar status: ' . $e->getMessage()
            ], 400);
        }
    }
}
```

### 3.4. Adicionar Rotas

Edite `routes/api.php`:

```php
// Pagamentos
Route::post('/payments/create-intent', [App\Http\Controllers\Api\PaymentController::class, 'createIntent']);
Route::post('/payments/confirm', [App\Http\Controllers\Api\PaymentController::class, 'confirm']);
Route::get('/payments/status/{paymentIntentId}', [App\Http\Controllers\Api\PaymentController::class, 'checkStatus']);
```

### 3.5. Configurar Serviço no Laravel

Edite `config/services.php`:

```php
'stripe' => [
    'key' => env('STRIPE_KEY'),
    'secret' => env('STRIPE_SECRET'),
    'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
],
```

## 🧪 Passo 4: Testar Pagamento

### Cartões de Teste do Stripe

Use estes cartões para testar:

- **Sucesso**: `4242 4242 4242 4242`
- **Recusado**: `4000 0000 0000 0002`
- **Saldo insuficiente**: `4000 0000 0000 9995`
- **CVV incorreto**: `4000 0000 0000 0127`

**Data de validade**: Qualquer data futura (ex: 12/25)  
**CVV**: Qualquer 3 dígitos (ex: 123)

## 🔔 Passo 5: Configurar Webhooks (Opcional)

Webhooks permitem que o Stripe notifique seu backend sobre eventos de pagamento.

1. No Dashboard do Stripe, vá em **Developers** → **Webhooks**
2. Clique em **Add endpoint**
3. URL: `https://seu-dominio.com/api/webhooks/stripe`
4. Selecione eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copie o **Signing secret**

## ✅ Checklist de Configuração

- [ ] Conta Stripe criada
- [ ] Chaves da API obtidas (teste)
- [ ] Variáveis de ambiente configuradas (frontend e backend)
- [ ] SDK do Stripe instalado no backend
- [ ] PaymentController criado
- [ ] Rotas de pagamento adicionadas
- [ ] Teste com cartão de teste realizado
- [ ] Webhooks configurados (opcional)

## 🚀 Próximos Passos

1. Teste com cartões de teste
2. Configure webhooks para notificações
3. Adicione logs de pagamento
4. Implemente tratamento de erros específicos
5. Quando estiver pronto, mude para chaves de produção

## 📚 Recursos

- [Documentação Stripe](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

