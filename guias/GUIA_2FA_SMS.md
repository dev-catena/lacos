# 📱 Guia: Autenticação de Dois Fatores (2FA) via SMS

## ❓ Preciso contratar um broker de SMS?

**Sim**, para enviar SMS de forma confiável e em escala, você precisa de um serviço/provedor de SMS. Existem opções gratuitas (limitadas) e pagas.

---

## 🆓 Opções Gratuitas (Limitadas)

### 1. **Twilio Trial** (Recomendado para começar)
- ✅ **$15.50 de crédito gratuito** ao criar conta
- ✅ ~1.500 SMS gratuitos (dependendo do país)
- ✅ API fácil de integrar
- ✅ Suporte a múltiplos países
- ⚠️ Após o crédito, cobra por uso (~$0.0075/SMS no Brasil)

**Custo após trial**: ~R$ 0,04 por SMS no Brasil

### 2. **Vonage (Nexmo)**
- ✅ Crédito inicial gratuito
- ✅ Boa documentação
- ⚠️ Preços similares ao Twilio

### 3. **AWS SNS** (Amazon)
- ✅ Primeiros 100 SMS/mês gratuitos
- ✅ Integração com outros serviços AWS
- ⚠️ Requer conta AWS
- ⚠️ Preço: ~$0.00645/SMS após o free tier

---

## 💰 Opções Pagas (Produção)

### 1. **Twilio** (Mais Popular)
- **Preço**: ~$0.0075/SMS no Brasil (~R$ 0,04)
- **Vantagens**:
  - API muito fácil de usar
  - Excelente documentação
  - Suporte a múltiplos países
  - Dashboard completo
  - Webhooks para status de entrega
- **Desvantagens**: Pode ficar caro em alto volume

### 2. **Zenvia** (Brasileira)
- **Preço**: A partir de R$ 0,05/SMS
- **Vantagens**:
  - Empresa brasileira
  - Suporte em português
  - Preços competitivos para Brasil
- **Desvantagens**: Menos conhecida internacionalmente

### 3. **TotalVoice** (Brasileira)
- **Preço**: A partir de R$ 0,04/SMS
- **Vantagens**:
  - Empresa brasileira
  - API simples
  - Boa para mercado brasileiro

### 4. **AWS SNS** (Amazon)
- **Preço**: $0.00645/SMS (~R$ 0,03)
- **Vantagens**:
  - Integração com outros serviços AWS
  - Escalável
  - Confiável
- **Desvantagens**: Configuração mais complexa

---

## 🎯 Recomendação por Cenário

### Para Testes/Desenvolvimento:
**Twilio Trial** - Use os $15.50 gratuitos para testar

### Para Produção Pequena/Média (< 1000 SMS/mês):
**Twilio** ou **Zenvia** - Preços similares, escolha pela facilidade

### Para Produção Grande (> 10.000 SMS/mês):
**Negocie com Zenvia/TotalVoice** - Empresas brasileiras podem oferecer melhores preços em volume

---

## 💡 Alternativas Sem Broker de SMS

### 1. **Aplicativo Autenticador** (Recomendado!)
- ✅ **100% Gratuito**
- ✅ Não depende de SMS
- ✅ Mais seguro (não pode ser interceptado)
- ✅ Funciona offline
- ✅ Apps populares: Google Authenticator, Authy, Microsoft Authenticator

**Como funciona**: Gera código QR que o usuário escaneia com o app. O app gera códigos de 6 dígitos que mudam a cada 30 segundos.

### 2. **Email** (Para 2FA)
- ✅ **Gratuito** (você já tem SMTP configurado)
- ✅ Não precisa de broker
- ⚠️ Menos seguro que SMS (email pode ser hackeado)
- ⚠️ Mais lento que SMS

---

## 📊 Comparação de Custos (Exemplo: 1.000 SMS/mês)

| Serviço | Custo Mensal | Custo Anual |
|---------|--------------|-------------|
| **Twilio** | ~R$ 40 | ~R$ 480 |
| **Zenvia** | ~R$ 50 | ~R$ 600 |
| **TotalVoice** | ~R$ 40 | ~R$ 480 |
| **AWS SNS** | ~R$ 30 | ~R$ 360 |
| **App Autenticador** | **R$ 0** | **R$ 0** |
| **Email** | **R$ 0** | **R$ 0** |

---

## 🚀 Implementação Recomendada

### Fase 1: Começar com App Autenticador (Gratuito)
- Implementar 2FA via Google Authenticator/Authy
- Zero custo
- Mais seguro
- Funciona offline

### Fase 2: Adicionar SMS como Opção (Opcional)
- Implementar SMS via Twilio (usar trial primeiro)
- Oferecer ambas as opções ao usuário
- SMS como fallback se o app não funcionar

---

## 📝 Exemplo de Código: Twilio no Laravel

### 1. Instalar SDK

```bash
composer require twilio/sdk
```

### 2. Configurar .env

```env
TWILIO_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Criar Service

```php
// app/Services/SmsService.php
namespace App\Services;

use Twilio\Rest\Client;

class SmsService
{
    protected $twilio;

    public function __construct()
    {
        $this->twilio = new Client(
            config('services.twilio.sid'),
            config('services.twilio.token')
        );
    }

    public function sendVerificationCode($phoneNumber, $code)
    {
        try {
            $message = $this->twilio->messages->create(
                $phoneNumber,
                [
                    'from' => config('services.twilio.phone'),
                    'body' => "Seu código de verificação Laços: {$code}"
                ]
            );

            return [
                'success' => true,
                'message_sid' => $message->sid
            ];
        } catch (\Exception $e) {
            \Log::error('Erro ao enviar SMS: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
```

### 4. Usar no Controller

```php
use App\Services\SmsService;

public function send2FACode(Request $request)
{
    $code = rand(100000, 999999); // Código de 6 dígitos
    
    // Salvar código no banco com expiração (ex: 5 minutos)
    $request->user()->update([
        'two_factor_code' => Hash::make($code),
        'two_factor_expires_at' => now()->addMinutes(5)
    ]);

    // Enviar SMS
    $smsService = new SmsService();
    $result = $smsService->sendVerificationCode(
        $request->user()->phone,
        $code
    );

    if ($result['success']) {
        return response()->json([
            'success' => true,
            'message' => 'Código enviado por SMS'
        ]);
    }

    return response()->json([
        'success' => false,
        'message' => 'Erro ao enviar SMS'
    ], 500);
}
```

---

## 🎯 Conclusão

### Para começar AGORA (sem custo):
✅ **Implemente 2FA via App Autenticador** (Google Authenticator)
- Zero custo
- Mais seguro
- Funciona offline

### Para adicionar SMS depois:
✅ **Use Twilio Trial** para testar
- $15.50 gratuito (~1.500 SMS)
- Depois avalie custos vs necessidade

### Custo estimado se implementar SMS:
- **Pequeno volume** (< 500 SMS/mês): ~R$ 20-30/mês
- **Médio volume** (1.000-5.000 SMS/mês): ~R$ 40-200/mês
- **Alto volume** (> 10.000 SMS/mês): Negocie desconto por volume

---

## 📚 Próximos Passos

1. **Decidir**: App Autenticador (gratuito) ou SMS (pago)?
2. **Se SMS**: Criar conta no Twilio e usar trial
3. **Implementar**: Backend + Frontend
4. **Testar**: Com usuários reais
5. **Monitorar**: Custos e uso

---

**Última atualização**: 2025-12-17


