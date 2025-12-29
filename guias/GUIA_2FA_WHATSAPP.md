# 💬 Guia: Autenticação de Dois Fatores (2FA) via WhatsApp

## ✅ Sim, dá para usar WhatsApp ao invés de SMS!

WhatsApp é uma excelente alternativa ao SMS, especialmente no Brasil onde é muito popular. Vou mostrar as opções disponíveis.

---

## 🎯 Vantagens do WhatsApp vs SMS

### ✅ Vantagens do WhatsApp:
- **Mais barato** que SMS (ou até gratuito)
- **Mais rápido** (entregas quase instantâneas)
- **Mais confiável** no Brasil (quase todo mundo tem WhatsApp)
- **Melhor experiência** (usuário vê notificação no WhatsApp)
- **Suporta emojis e formatação** (código mais bonito)

### ⚠️ Desvantagens:
- Usuário precisa ter WhatsApp instalado
- Requer conexão com internet
- Algumas APIs têm limitações

---

## 🚀 Opções Disponíveis

### 1. **WhatsApp Business API (Oficial)** ⭐ Recomendado para Produção

**Como funciona**: API oficial do Meta/Facebook para WhatsApp Business

**Vantagens**:
- ✅ Oficial e confiável
- ✅ Alta taxa de entrega
- ✅ Suporte oficial
- ✅ Escalável

**Desvantagens**:
- ⚠️ Requer aprovação do Meta (pode demorar)
- ⚠️ Requer número de WhatsApp Business verificado
- ⚠️ Pode ter custos (depende do volume)

**Custo**: 
- Primeiros 1.000 conversas/mês: **GRATUITO**
- Depois: ~$0.005-0.009 por conversa (~R$ 0,02-0,04)

**Como começar**:
1. Criar conta em https://business.facebook.com
2. Aplicar para WhatsApp Business API
3. Aguardar aprovação (pode levar dias/semanas)
4. Integrar via API

---

### 2. **Evolution API** ⭐ Recomendado para Começar Rápido

**Como funciona**: API open-source que usa WhatsApp Web

**Vantagens**:
- ✅ **100% GRATUITO** (self-hosted)
- ✅ Funciona imediatamente (sem aprovação)
- ✅ Fácil de integrar
- ✅ Suporta múltiplos números

**Desvantagens**:
- ⚠️ Precisa hospedar você mesmo (ou usar serviço pago)
- ⚠️ Pode ser bloqueado pelo WhatsApp (se usar mal)
- ⚠️ Requer número de celular dedicado

**Custo**: 
- Self-hosted: **GRATUITO**
- Serviços gerenciados: ~R$ 50-200/mês

**Links**:
- GitHub: https://github.com/EvolutionAPI/evolution-api
- Documentação: https://doc.evolution-api.com

---

### 3. **Twilio WhatsApp** ⭐ Mais Fácil de Integrar

**Como funciona**: Twilio oferece WhatsApp via sua API

**Vantagens**:
- ✅ API muito fácil de usar
- ✅ Excelente documentação
- ✅ Dashboard completo
- ✅ Suporte profissional

**Desvantagens**:
- ⚠️ Mais caro que outras opções
- ⚠️ Requer aprovação do Twilio

**Custo**: 
- Trial: $15.50 gratuito
- Depois: ~$0.005 por mensagem (~R$ 0,02)

**Link**: https://www.twilio.com/whatsapp

---

### 4. **Z-API / Z-API Cloud** (Brasileira)

**Como funciona**: Serviço brasileiro especializado em WhatsApp

**Vantagens**:
- ✅ Empresa brasileira
- ✅ Suporte em português
- ✅ Preços competitivos
- ✅ Fácil integração

**Desvantagens**:
- ⚠️ Menos conhecida internacionalmente

**Custo**: 
- A partir de R$ 49/mês (ilimitado em alguns planos)

**Link**: https://z-api.io

---

### 5. **Baileys** (Biblioteca Node.js)

**Como funciona**: Biblioteca JavaScript que conecta direto ao WhatsApp

**Vantagens**:
- ✅ **100% GRATUITO**
- ✅ Controle total
- ✅ Open-source

**Desvantagens**:
- ⚠️ Mais complexo de implementar
- ⚠️ Precisa manter você mesmo
- ⚠️ Pode quebrar com atualizações do WhatsApp

**Link**: https://github.com/WhiskeySockets/Baileys

---

## 🎯 Recomendação por Cenário

### Para Começar AGORA (Testes/Desenvolvimento):
**Evolution API** (self-hosted) ou **Baileys**
- Gratuito
- Funciona imediatamente
- Perfeito para testes

### Para Produção Pequena/Média:
**Z-API Cloud** ou **Evolution API** (serviço gerenciado)
- Preços acessíveis
- Suporte em português
- Fácil de integrar

### Para Produção Grande/Escalável:
**WhatsApp Business API** (oficial)
- Mais confiável
- Melhor suporte
- Escalável

---

## 💻 Implementação: Evolution API (Gratuito)

### Passo 1: Instalar Evolution API

```bash
# ✅ Recomendado: usar o script com PostgreSQL (Evolution API v2 exige banco)
# No servidor:
sudo bash /tmp/INSTALAR_EVOLUTION_API_COM_POSTGRES.sh
```

> Observação: com a imagem `atendai/evolution-api:latest`, tentar rodar “sem banco” ou com providers como `jsonfile`/`mongodb` normalmente resulta em:
> `Error: Database provider <x> invalid.`

### Passo 2: Criar Instância WhatsApp

```bash
# ✅ Forma mais segura (evita travar terminal por colar curl com \)
export WHATSAPP_API_URL=http://localhost:8080
export WHATSAPP_API_KEY=SUA_CHAVE_AQUI
export WHATSAPP_INSTANCE_NAME=lacos-2fa
sudo -E bash /tmp/CRIAR_INSTANCIA_WHATSAPP.sh
```

### Passo 3: Conectar WhatsApp (Escanear QR Code)

```bash
# Obter QR Code
curl http://localhost:8080/instance/connect/lacos-2fa \
  -H "apikey: SUA_CHAVE_AQUI"
```

### Passo 4: Integrar no Laravel

```php
// app/Services/WhatsAppService.php
namespace App\Services;

use Illuminate\Support\Facades\Http;

class WhatsAppService
{
    protected $apiUrl;
    protected $apiKey;
    protected $instanceName;

    public function __construct()
    {
        $this->apiUrl = config('services.whatsapp.url');
        $this->apiKey = config('services.whatsapp.api_key');
        $this->instanceName = config('services.whatsapp.instance_name');
    }

    public function sendVerificationCode($phoneNumber, $code)
    {
        try {
            // Formatar número (remover caracteres especiais, adicionar código do país)
            $phone = $this->formatPhoneNumber($phoneNumber);
            
            $message = "🔐 *Código de Verificação Laços*\n\n";
            $message .= "Seu código de verificação é: *{$code}*\n\n";
            $message .= "Este código expira em 5 minutos.\n";
            $message .= "Se você não solicitou este código, ignore esta mensagem.";

            $response = Http::withHeaders([
                'apikey' => $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post("{$this->apiUrl}/message/sendText/{$this->instanceName}", [
                'number' => $phone,
                'text' => $message,
            ]);

            if ($response->successful()) {
                \Log::info('WhatsApp 2FA enviado', [
                    'phone' => $phone,
                    'code' => $code,
                ]);

                return [
                    'success' => true,
                    'message_id' => $response->json('key.id'),
                ];
            }

            return [
                'success' => false,
                'error' => $response->json('message', 'Erro desconhecido'),
            ];
        } catch (\Exception $e) {
            \Log::error('Erro ao enviar WhatsApp 2FA: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    protected function formatPhoneNumber($phone)
    {
        // Remover caracteres não numéricos
        $phone = preg_replace('/\D/', '', $phone);
        
        // Se não começar com código do país, adicionar +55 (Brasil)
        if (!str_starts_with($phone, '55')) {
            $phone = '55' . $phone;
        }
        
        return $phone;
    }
}
```

### Passo 5: Configurar .env

```env
WHATSAPP_API_URL=http://localhost:8080
WHATSAPP_API_KEY=sua_chave_aqui
WHATSAPP_INSTANCE_NAME=lacos-2fa
```

### Passo 6: Configurar config/services.php

```php
'whatsapp' => [
    'url' => env('WHATSAPP_API_URL'),
    'api_key' => env('WHATSAPP_API_KEY'),
    'instance_name' => env('WHATSAPP_INSTANCE_NAME'),
],
```

### Passo 7: Usar no Controller

```php
// app/Http/Controllers/Api/AuthController.php
use App\Services\WhatsAppService;

public function send2FACode(Request $request)
{
    $user = $request->user();
    
    // Gerar código de 6 dígitos
    $code = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
    
    // Salvar código no banco com expiração
    $user->update([
        'two_factor_code' => Hash::make($code),
        'two_factor_expires_at' => now()->addMinutes(5),
    ]);

    // Enviar via WhatsApp
    $whatsappService = new WhatsAppService();
    $result = $whatsappService->sendVerificationCode(
        $user->phone,
        $code
    );

    if ($result['success']) {
        return response()->json([
            'success' => true,
            'message' => 'Código enviado via WhatsApp',
        ]);
    }

    return response()->json([
        'success' => false,
        'message' => 'Erro ao enviar código',
        'error' => $result['error'],
    ], 500);
}
```

---

## 💻 Implementação: Twilio WhatsApp

### Passo 1: Instalar SDK

```bash
composer require twilio/sdk
```

### Passo 2: Configurar .env

```env
TWILIO_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### Passo 3: Criar Service

```php
// app/Services/WhatsAppService.php
use Twilio\Rest\Client;

class WhatsAppService
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
            $message = "🔐 *Código de Verificação Laços*\n\n";
            $message .= "Seu código: *{$code}*\n\n";
            $message .= "Expira em 5 minutos.";

            $message = $this->twilio->messages->create(
                "whatsapp:{$phoneNumber}",
                [
                    'from' => config('services.twilio.whatsapp_from'),
                    'body' => $message,
                ]
            );

            return [
                'success' => true,
                'message_sid' => $message->sid,
            ];
        } catch (\Exception $e) {
            \Log::error('Erro ao enviar WhatsApp: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}
```

---

## 📊 Comparação de Custos (1.000 mensagens/mês)

| Serviço | Custo Mensal | Custo Anual |
|---------|--------------|-------------|
| **Evolution API (self-hosted)** | **R$ 0** | **R$ 0** |
| **Evolution API (gerenciado)** | R$ 50-200 | R$ 600-2.400 |
| **WhatsApp Business API** | **R$ 0** (primeiros 1.000) | **R$ 0-240** |
| **Twilio WhatsApp** | ~R$ 20 | ~R$ 240 |
| **Z-API Cloud** | R$ 49+ | R$ 588+ |

---

## 🎯 Recomendação Final

### Para Começar AGORA (Gratuito):
✅ **Evolution API** (self-hosted)
- Instale via Docker
- Funciona imediatamente
- Zero custo

### Para Produção:
✅ **WhatsApp Business API** (oficial)
- Mais confiável
- Primeiros 1.000/mês gratuitos
- Melhor para escalar

---

## 📝 Próximos Passos

1. **Escolher serviço**: Evolution API (gratuito) ou WhatsApp Business API (oficial)
2. **Configurar**: Instalar e configurar o serviço escolhido
3. **Integrar**: Adicionar código no Laravel
4. **Testar**: Enviar códigos de teste
5. **Atualizar Frontend**: Modificar SecurityScreen para usar WhatsApp

---

## ⚠️ Importante

- **Número dedicado**: Use um número de celular dedicado para WhatsApp Business
- **Não spam**: Não envie muitas mensagens ou pode ser bloqueado
- **Template messages**: WhatsApp Business API requer templates pré-aprovados para mensagens
- **Backup**: Tenha um método alternativo (email ou app autenticador) caso WhatsApp falhe

---

**Última atualização**: 2025-12-17

