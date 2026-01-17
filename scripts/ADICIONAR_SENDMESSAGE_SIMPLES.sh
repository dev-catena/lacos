#!/bin/bash

# Script simples para adicionar método sendMessage ao WhatsAppService
SERVER="193.203.182.22"
PORT="63022"
USER="darley"
PASSWORD="yhvh77"

echo "🔧 Adicionando método sendMessage ao WhatsAppService..."

# Criar arquivo com o método sendMessage
cat > /tmp/sendMessage_method.php << 'METHOD'
    /**
     * Enviar mensagem genérica via WhatsApp
     */
    public function sendMessage($phoneNumber, $message)
    {
        try {
            $phone = $this->formatPhoneNumber($phoneNumber);
            
            Log::info('Enviando mensagem WhatsApp', [
                'phone' => $phone,
                'instance' => $this->instanceName,
            ]);

            $response = Http::timeout(30)->withHeaders([
                'apikey' => $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post("{$this->apiUrl}/message/sendText/{$this->instanceName}", [
                'number' => $phone,
                'text' => $message,
            ]);

            if ($response->successful()) {
                $responseData = $response->json();
                
                Log::info('WhatsApp enviado com sucesso', [
                    'phone' => $phone,
                    'message_id' => $responseData['key']['id'] ?? null,
                ]);

                return [
                    'success' => true,
                    'message_id' => $responseData['key']['id'] ?? null,
                ];
            }

            $errorMessage = $response->json('message', 'Erro desconhecido');
            
            Log::error('Erro ao enviar WhatsApp', [
                'phone' => $phone,
                'status' => $response->status(),
                'error' => $errorMessage,
            ]);

            return [
                'success' => false,
                'error' => $errorMessage,
            ];
        } catch (\Exception $e) {
            Log::error('Exceção ao enviar WhatsApp: ' . $e->getMessage(), [
                'phone' => $phoneNumber,
                'exception' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => 'Erro ao enviar mensagem: ' . $e->getMessage(),
            ];
        }
    }

METHOD

# Enviar para o servidor e aplicar
sshpass -p "$PASSWORD" scp -P "$PORT" -o StrictHostKeyChecking=no \
    /tmp/sendMessage_method.php \
    "$USER@$SERVER:/tmp/sendMessage_method.php"

# Executar no servidor para inserir o método
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no "$USER@$SERVER" << REMOTE_SCRIPT
SERVICE_FILE="/var/www/lacos-backend/app/Services/WhatsAppService.php"
BACKUP_FILE="\${SERVICE_FILE}.backup.\$(date +%Y%m%d_%H%M%S)"

# Fazer backup
echo '$PASSWORD' | sudo -S cp "\$SERVICE_FILE" "\$BACKUP_FILE"
echo "✅ Backup criado: \$BACKUP_FILE"

# Verificar se já existe
if grep -q "public function sendMessage" "\$SERVICE_FILE"; then
    echo "ℹ️  Método sendMessage já existe"
else
    # Inserir antes de checkConnection
    echo '$PASSWORD' | sudo -S sed -i '/public function checkConnection/i\
'"\$(cat /tmp/sendMessage_method.php)"'
' "\$SERVICE_FILE"
    echo "✅ Método sendMessage adicionado!"
fi

# Limpar cache
cd /var/www/lacos-backend
echo '$PASSWORD' | sudo -S -u www-data php artisan config:clear
echo '$PASSWORD' | sudo -S -u www-data php artisan cache:clear

echo "✅ Cache limpo!"
REMOTE_SCRIPT

echo ""
echo "✅ Concluído!"

