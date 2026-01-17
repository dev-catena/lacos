#!/bin/bash

# Script para adicionar método sendMessage ao WhatsAppService no servidor
# Servidor: 193.203.182.22 (porta 63022)

set -e

SERVER="193.203.182.22"
PORT="63022"
USER="darley"
PASSWORD="yhvh77"
REMOTE_PATH="/var/www/lacos-backend"
SERVICE_FILE="$REMOTE_PATH/app/Services/WhatsAppService.php"

echo "🔧 Adicionando método sendMessage ao WhatsAppService..."
echo "   Servidor: $USER@$SERVER:$PORT"
echo ""

# Verificar se sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    echo "❌ sshpass não está instalado!"
    echo "   Instale com: sudo apt-get install sshpass"
    exit 1
fi

# Criar script para executar no servidor
cat > /tmp/add_sendmessage.sh << 'SCRIPT'
#!/bin/bash
set -e

SERVICE_FILE="/var/www/lacos-backend/app/Services/WhatsAppService.php"
BACKUP_FILE="${SERVICE_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

echo "📋 Fazendo backup de WhatsAppService.php..."
sudo cp "$SERVICE_FILE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"

echo ""
echo "🔍 Verificando se método sendMessage já existe..."

if grep -q "public function sendMessage" "$SERVICE_FILE"; then
    echo "ℹ️  Método sendMessage já existe. Pulando..."
else
    echo "➕ Adicionando método sendMessage..."
    
    # Encontrar a linha com checkConnection e adicionar sendMessage antes dela
    if grep -q "public function checkConnection" "$SERVICE_FILE"; then
        # Criar método sendMessage
        METHOD_CODE='
    /**
     * Enviar mensagem genérica via WhatsApp
     */
    public function sendMessage($phoneNumber, $message)
    {
        try {
            $phone = $this->formatPhoneNumber($phoneNumber);
            
            Log::info(\'Enviando mensagem WhatsApp\', [
                \'phone\' => $phone,
                \'instance\' => $this->instanceName,
            ]);

            $response = Http::timeout(30)->withHeaders([
                \'apikey\' => $this->apiKey,
                \'Content-Type\' => \'application/json\',
            ])->post("{$this->apiUrl}/message/sendText/{$this->instanceName}", [
                \'number\' => $phone,
                \'text\' => $message,
            ]);

            if ($response->successful()) {
                $responseData = $response->json();
                
                Log::info(\'WhatsApp enviado com sucesso\', [
                    \'phone\' => $phone,
                    \'message_id\' => $responseData[\'key\'][\'id\'] ?? null,
                ]);

                return [
                    \'success\' => true,
                    \'message_id\' => $responseData[\'key\'][\'id\'] ?? null,
                ];
            }

            $errorMessage = $response->json(\'message\', \'Erro desconhecido\');
            
            Log::error(\'Erro ao enviar WhatsApp\', [
                \'phone\' => $phone,
                \'status\' => $response->status(),
                \'error\' => $errorMessage,
            ]);

            return [
                \'success\' => false,
                \'error\' => $errorMessage,
            ];
        } catch (\Exception $e) {
            Log::error(\'Exceção ao enviar WhatsApp: \' . $e->getMessage(), [
                \'phone\' => $phoneNumber,
                \'exception\' => $e->getTraceAsString(),
            ]);

            return [
                \'success\' => false,
                \'error\' => \'Erro ao enviar mensagem: \' . $e->getMessage(),
            ];
        }
    }

'
        
        # Usar Python para inserir o método antes de checkConnection
        python3 << PYTHON
import re

with open("$SERVICE_FILE", "r") as f:
    content = f.read()

# Verificar se já existe
if "public function sendMessage" in content:
    print("ℹ️  Método sendMessage já existe")
    exit(0)

# Encontrar a linha com checkConnection e inserir antes
pattern = r'(    /\*\*\s*\n\s+\* Verificar se a instância está conectada)'
replacement = r'''$METHOD_CODE$1'''

new_content = re.sub(pattern, replacement, content)

if new_content == content:
    print("❌ Não foi possível encontrar o local para inserir o método")
    exit(1)

with open("$SERVICE_FILE", "w") as f:
    f.write(new_content)

print("✅ Método sendMessage adicionado!")
PYTHON
        
        # Se Python não funcionar, usar sed como fallback
        if [ $? -ne 0 ]; then
            echo "⚠️  Tentando método alternativo com sed..."
            # Inserir antes de checkConnection usando sed
            sudo sed -i '/public function checkConnection/i\
\
    /**\
     * Enviar mensagem genérica via WhatsApp\
     */\
    public function sendMessage($phoneNumber, $message)\
    {\
        try {\
            $phone = $this->formatPhoneNumber($phoneNumber);\
            \
            Log::info(\x27Enviando mensagem WhatsApp\x27, [\
                \x27phone\x27 => $phone,\
                \x27instance\x27 => $this->instanceName,\
            ]);\
\
            $response = Http::timeout(30)->withHeaders([\
                \x27apikey\x27 => $this->apiKey,\
                \x27Content-Type\x27 => \x27application/json\x27,\
            ])->post("{$this->apiUrl}/message/sendText/{$this->instanceName}", [\
                \x27number\x27 => $phone,\
                \x27text\x27 => $message,\
            ]);\
\
            if ($response->successful()) {\
                $responseData = $response->json();\
                \
                Log::info(\x27WhatsApp enviado com sucesso\x27, [\
                    \x27phone\x27 => $phone,\
                    \x27message_id\x27 => $responseData[\x27key\x27][\x27id\x27] ?? null,\
                ]);\
\
                return [\
                    \x27success\x27 => true,\
                    \x27message_id\x27 => $responseData[\x27key\x27][\x27id\x27] ?? null,\
                ];\
            }\
\
            $errorMessage = $response->json(\x27message\x27, \x27Erro desconhecido\x27);\
            \
            Log::error(\x27Erro ao enviar WhatsApp\x27, [\
                \x27phone\x27 => $phone,\
                \x27status\x27 => $response->status(),\
                \x27error\x27 => $errorMessage,\
            ]);\
\
            return [\
                \x27success\x27 => false,\
                \x27error\x27 => $errorMessage,\
            ];\
        } catch (\Exception $e) {\
            Log::error(\x27Exceção ao enviar WhatsApp: \x27 . $e->getMessage(), [\
                \x27phone\x27 => $phoneNumber,\
                \x27exception\x27 => $e->getTraceAsString(),\
            ]);\
\
            return [\
                \x27success\x27 => false,\
                \x27error\x27 => \x27Erro ao enviar mensagem: \x27 . $e->getMessage(),\
            ];\
        }\
    }\
' "$SERVICE_FILE"
        fi
    else
        echo "❌ Não foi possível encontrar o método checkConnection em WhatsAppService.php"
        exit 1
    fi
fi

echo ""
echo "✅ WhatsAppService atualizado!"
SCRIPT

# Enviar script para o servidor
echo "📤 Enviando script para o servidor..."
sshpass -p "$PASSWORD" scp -P "$PORT" -o StrictHostKeyChecking=no \
    /tmp/add_sendmessage.sh \
    "$USER@$SERVER:/tmp/add_sendmessage.sh"

# Executar no servidor
echo ""
echo "🔧 Executando script no servidor..."
sshpass -p "$PASSWORD" ssh -p "$PORT" -o StrictHostKeyChecking=no \
    "$USER@$SERVER" "chmod +x /tmp/add_sendmessage.sh && echo '$PASSWORD' | sudo -S bash /tmp/add_sendmessage.sh"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Método sendMessage adicionado com sucesso!"
    echo ""
    echo "💡 Agora o login deve funcionar corretamente."
else
    echo ""
    echo "❌ Erro ao adicionar método. Verifique os logs acima."
    exit 1
fi

