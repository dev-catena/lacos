<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected $apiUrl;
    protected $apiKey;
    protected $instanceName;

    public function __construct()
    {
        $this->apiUrl = config('services.whatsapp.url', env('WHATSAPP_API_URL'));
        $this->apiKey = config('services.whatsapp.api_key', env('WHATSAPP_API_KEY'));
        $this->instanceName = config('services.whatsapp.instance_name', env('WHATSAPP_INSTANCE_NAME'));
    }

    /**
     * Enviar código de verificação 2FA via WhatsApp
     */
    public function sendVerificationCode($phoneNumber, $code)
    {
        try {
            // Formatar número de telefone
            $phone = $this->formatPhoneNumber($phoneNumber);
            
            // Criar mensagem formatada
            $message = "🔐 *Código de Verificação Laços*\n\n";
            $message .= "Seu código de verificação é: *{$code}*\n\n";
            $message .= "Este código expira em 5 minutos.\n\n";
            $message .= "⚠️ Se você não solicitou este código, ignore esta mensagem.";

            Log::info('Enviando código 2FA via WhatsApp', [
                'phone' => $phone,
                'instance' => $this->instanceName,
            ]);

            // Enviar mensagem via Evolution API
            $response = Http::timeout(30)->withHeaders([
                'apikey' => $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post("{$this->apiUrl}/message/sendText/{$this->instanceName}", [
                'number' => $phone,
                'text' => $message,
            ]);

            if ($response->successful()) {
                $responseData = $response->json();
                
                Log::info('WhatsApp 2FA enviado com sucesso', [
                    'phone' => $phone,
                    'message_id' => $responseData['key']['id'] ?? null,
                ]);

                return [
                    'success' => true,
                    'message_id' => $responseData['key']['id'] ?? null,
                    'message' => 'Código enviado via WhatsApp',
                ];
            }

            $errorMessage = $response->json('message', 'Erro desconhecido');
            
            Log::error('Erro ao enviar WhatsApp 2FA', [
                'phone' => $phone,
                'status' => $response->status(),
                'error' => $errorMessage,
                'response' => $response->body(),
            ]);

            return [
                'success' => false,
                'error' => $errorMessage,
            ];
        } catch (\Exception $e) {
            Log::error('Exceção ao enviar WhatsApp 2FA: ' . $e->getMessage(), [
                'phone' => $phoneNumber,
                'exception' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => 'Erro ao enviar mensagem WhatsApp: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Verificar se a instância está conectada
     */
    public function checkConnection()
    {
        try {
            $response = Http::timeout(10)->withHeaders([
                'apikey' => $this->apiKey,
            ])->get("{$this->apiUrl}/instance/fetchInstances");

            if ($response->successful()) {
                $instances = $response->json();
                $instance = collect($instances)->firstWhere('instance.instanceName', $this->instanceName);
                
                if ($instance && isset($instance['instance']['status'])) {
                    return [
                        'success' => true,
                        'connected' => $instance['instance']['status'] === 'open',
                        'status' => $instance['instance']['status'],
                    ];
                }
            }

            return [
                'success' => false,
                'error' => 'Não foi possível verificar conexão',
            ];
        } catch (\Exception $e) {
            Log::error('Erro ao verificar conexão WhatsApp: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Formatar número de telefone para formato internacional
     */
    protected function formatPhoneNumber($phone)
    {
        // Remover caracteres não numéricos
        $phone = preg_replace('/\D/', '', $phone);
        
        // Se não começar com código do país, adicionar +55 (Brasil)
        if (!str_starts_with($phone, '55')) {
            // Se começar com 0, remover
            if (str_starts_with($phone, '0')) {
                $phone = substr($phone, 1);
            }
            $phone = '55' . $phone;
        }
        
        return $phone;
    }
}

