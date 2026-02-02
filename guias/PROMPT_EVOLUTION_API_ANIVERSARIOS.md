# 🎂 Prompt: Implementação Evolution API - Lembretes de Aniversário via WhatsApp

## 📋 Contexto do Projeto

Você precisa implementar um sistema que:
1. **Configura a Evolution API** para envio de mensagens WhatsApp
2. **Envia mensagens automáticas** para uma pessoa (coordenador/administrador)
3. **Todos os dias anteriores** a uma data de aniversário
4. **Lista pessoas** que farão aniversário no dia seguinte
5. **Roda diariamente** via cron job ou scheduler

---

## 🎯 Requisitos Funcionais

### Funcionalidade Principal
- **Entrada**: Lista de pessoas com datas de aniversário
- **Processo**: Verificar diariamente quais pessoas farão aniversário no dia seguinte
- **Saída**: Enviar WhatsApp para o coordenador com a lista de aniversariantes do próximo dia
- **Frequência**: Executar todos os dias (ex: às 08:00)

### Exemplo de Mensagem
```
🎂 *Lembrete de Aniversários - Amanhã*

Olá! Segue a lista de pessoas que farão aniversário amanhã:

👤 *Maria Silva* - 15/03/1990 (34 anos)
👤 *João Santos* - 15/03/1995 (29 anos)
👤 *Ana Costa* - 15/03/2000 (24 anos)

Total: 3 aniversariantes

_Esta é uma mensagem automática do sistema._
```

---

## 🛠️ Implementação Técnica

### 1. Estrutura de Dados

#### Tabela: `people` ou `users`
```sql
CREATE TABLE people (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    birthday DATE NOT NULL,  -- Apenas dia/mês (ignorar ano ou usar ano fixo)
    phone VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    INDEX idx_birthday (birthday)
);
```

**Nota**: Para aniversários, você pode:
- Armazenar apenas `MM-DD` (mês-dia)
- Ou usar um ano fixo (ex: 2000) e comparar apenas mês/dia
- Ou usar função que extrai mês/dia da data

#### Tabela: `birthday_reminders` (opcional - para logs)
```sql
CREATE TABLE birthday_reminders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reminder_date DATE NOT NULL,
    coordinator_phone VARCHAR(20),
    people_count INT,
    sent_at TIMESTAMP,
    message_id VARCHAR(255),
    status ENUM('pending', 'sent', 'failed'),
    created_at TIMESTAMP
);
```

---

### 2. Configuração Evolution API

#### Instalação via Docker (Recomendado)

```bash
# Criar diretório
mkdir evolution-api
cd evolution-api

# Criar docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  evolution-api:
    image: atendai/evolution-api:latest
    container_name: evolution-api
    restart: always
    ports:
      - "8080:8080"
    environment:
      - AUTHENTICATION_API_KEY=SUA_API_KEY_AQUI
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://user:password@postgres:5432/evolution
    volumes:
      - evolution_instances:/evolution/instances
      - evolution_store:/evolution/store
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    container_name: evolution-postgres
    restart: always
    environment:
      - POSTGRES_DB=evolution
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  evolution_instances:
  evolution_store:
  postgres_data:
EOF

# Iniciar serviços
docker-compose up -d

# Ver logs
docker-compose logs -f evolution-api
```

#### Gerar API Key
```bash
# A API Key é definida no docker-compose.yml
# Ou você pode gerar uma aleatória:
openssl rand -base64 32
```

#### Conectar WhatsApp (Criar Instância)
```bash
# Via API
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: SUA_API_KEY_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "aniversarios",
    "token": "SEU_TOKEN_OPCIONAL",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'

# Resposta inclui QR Code - escanear com WhatsApp
# Ou usar pairing code (se Evolution API suportar)
```

---

### 3. Código Backend (Laravel/PHP)

#### Service: `WhatsAppService.php`
```php
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
        $this->apiUrl = config('services.whatsapp.url', env('WHATSAPP_API_URL', 'http://localhost:8080'));
        $this->apiKey = config('services.whatsapp.api_key', env('WHATSAPP_API_KEY'));
        $this->instanceName = config('services.whatsapp.instance_name', env('WHATSAPP_INSTANCE_NAME', 'aniversarios'));
    }

    /**
     * Enviar mensagem via WhatsApp
     */
    public function sendMessage($phoneNumber, $message)
    {
        try {
            $phone = $this->formatPhoneNumber($phoneNumber);
            
            Log::info('Enviando WhatsApp', [
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
            Log::error('Erro ao verificar conexão: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Formatar número de telefone (Brasil: +55)
     */
    protected function formatPhoneNumber($phone)
    {
        // Remover caracteres não numéricos
        $phone = preg_replace('/\D/', '', $phone);
        
        // Se não começar com código do país, adicionar +55 (Brasil)
        if (!str_starts_with($phone, '55')) {
            if (str_starts_with($phone, '0')) {
                $phone = substr($phone, 1);
            }
            $phone = '55' . $phone;
        }
        
        return $phone;
    }
}
```

#### Command: `SendBirthdayReminders.php`
```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\WhatsAppService;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class SendBirthdayReminders extends Command
{
    protected $signature = 'birthdays:send-reminders';
    protected $description = 'Enviar lembretes de aniversários do próximo dia via WhatsApp';

    protected $whatsappService;
    protected $coordinatorPhone;

    public function __construct()
    {
        parent::__construct();
        $this->whatsappService = new WhatsAppService();
        $this->coordinatorPhone = env('BIRTHDAY_COORDINATOR_PHONE');
    }

    public function handle()
    {
        $this->info('🔍 Verificando aniversários do próximo dia...');

        // Verificar conexão WhatsApp
        $connection = $this->whatsappService->checkConnection();
        if (!$connection['success'] || !$connection['connected']) {
            $this->error('❌ WhatsApp não está conectado!');
            Log::error('WhatsApp desconectado ao tentar enviar lembretes de aniversário');
            return 1;
        }

        if (!$this->coordinatorPhone) {
            $this->error('❌ Telefone do coordenador não configurado!');
            return 1;
        }

        // Data de amanhã
        $tomorrow = Carbon::tomorrow();
        $tomorrowMonth = $tomorrow->month;
        $tomorrowDay = $tomorrow->day;

        // Buscar pessoas que fazem aniversário amanhã
        // Opção 1: Se birthday armazena apenas mês/dia (usando DATE_FORMAT)
        $people = DB::table('people')
            ->whereRaw("MONTH(birthday) = ? AND DAY(birthday) = ?", [$tomorrowMonth, $tomorrowDay])
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        // Opção 2: Se birthday armazena data completa (usando ano fixo 2000 para comparação)
        // $people = DB::table('people')
        //     ->whereRaw("DATE_FORMAT(birthday, '%m-%d') = ?", [$tomorrow->format('m-d')])
        //     ->where('is_active', true)
        //     ->orderBy('name')
        //     ->get();

        if ($people->isEmpty()) {
            $this->info('✅ Nenhum aniversário amanhã. Nada a fazer.');
            Log::info('Nenhum aniversário detectado para ' . $tomorrow->format('d/m/Y'));
            return 0;
        }

        // Construir mensagem
        $message = $this->buildMessage($people, $tomorrow);

        // Enviar WhatsApp
        $result = $this->whatsappService->sendMessage($this->coordinatorPhone, $message);

        if ($result['success']) {
            $this->info("✅ Lembrete enviado com sucesso para {$this->coordinatorPhone}");
            $this->info("📊 Total de aniversariantes: {$people->count()}");
            
            // Log opcional
            DB::table('birthday_reminders')->insert([
                'reminder_date' => $tomorrow->toDateString(),
                'coordinator_phone' => $this->coordinatorPhone,
                'people_count' => $people->count(),
                'sent_at' => now(),
                'message_id' => $result['message_id'] ?? null,
                'status' => 'sent',
                'created_at' => now(),
            ]);

            return 0;
        } else {
            $this->error("❌ Erro ao enviar: {$result['error']}");
            Log::error('Erro ao enviar lembrete de aniversário', [
                'error' => $result['error'],
                'phone' => $this->coordinatorPhone,
            ]);
            return 1;
        }
    }

    /**
     * Construir mensagem formatada
     */
    private function buildMessage($people, $tomorrow)
    {
        $message = "🎂 *Lembrete de Aniversários - Amanhã*\n\n";
        $message .= "Olá! Segue a lista de pessoas que farão aniversário amanhã ({$tomorrow->format('d/m/Y')}):\n\n";

        foreach ($people as $person) {
            $birthday = Carbon::parse($person->birthday);
            $age = $tomorrow->year - $birthday->year;
            
            // Ajustar idade se aniversário ainda não passou este ano
            if ($tomorrow->month < $birthday->month || 
                ($tomorrow->month == $birthday->month && $tomorrow->day < $birthday->day)) {
                $age--;
            }

            $message .= "👤 *{$person->name}*";
            if ($person->birthday) {
                $message .= " - {$birthday->format('d/m/Y')} ({$age} anos)";
            }
            $message .= "\n";
        }

        $message .= "\n📊 *Total:* {$people->count()} aniversariante(s)\n\n";
        $message .= "_Esta é uma mensagem automática do sistema._";

        return $message;
    }
}
```

#### Config: `config/services.php`
```php
'whatsapp' => [
    'url' => env('WHATSAPP_API_URL', 'http://localhost:8080'),
    'api_key' => env('WHATSAPP_API_KEY'),
    'instance_name' => env('WHATSAPP_INSTANCE_NAME', 'aniversarios'),
],
```

#### Variáveis de Ambiente: `.env`
```env
# Evolution API
WHATSAPP_API_URL=http://localhost:8080
WHATSAPP_API_KEY=sua_api_key_aqui
WHATSAPP_INSTANCE_NAME=aniversarios

# Coordenador que receberá os lembretes
BIRTHDAY_COORDINATOR_PHONE=5531999999999
```

---

### 4. Configuração do Cron Job

#### Laravel Scheduler (`app/Console/Kernel.php`)
```php
protected function schedule(Schedule $schedule)
{
    // Enviar lembretes de aniversário todos os dias às 08:00
    $schedule->command('birthdays:send-reminders')
        ->dailyAt('08:00')
        ->timezone('America/Sao_Paulo');
}
```

#### Crontab (Alternativa)
```bash
# Editar crontab
crontab -e

# Adicionar linha (executar todos os dias às 08:00)
0 8 * * * cd /caminho/do/projeto && php artisan birthdays:send-reminders >> /dev/null 2>&1
```

---

### 5. Teste Manual

```bash
# Testar comando manualmente
php artisan birthdays:send-reminders

# Verificar logs
tail -f storage/logs/laravel.log
```

---

## 📝 Checklist de Implementação

- [ ] **1. Instalar Evolution API** (Docker)
  - [ ] Criar `docker-compose.yml`
  - [ ] Iniciar containers
  - [ ] Gerar API Key
  - [ ] Criar instância WhatsApp
  - [ ] Escanear QR Code

- [ ] **2. Configurar Backend**
  - [ ] Criar `WhatsAppService`
  - [ ] Criar Command `SendBirthdayReminders`
  - [ ] Adicionar variáveis no `.env`
  - [ ] Configurar `config/services.php`

- [ ] **3. Banco de Dados**
  - [ ] Criar tabela `people` com campo `birthday`
  - [ ] (Opcional) Criar tabela `birthday_reminders` para logs
  - [ ] Popular dados de teste

- [ ] **4. Agendamento**
  - [ ] Configurar Laravel Scheduler OU
  - [ ] Configurar Crontab

- [ ] **5. Testes**
  - [ ] Testar envio manual
  - [ ] Verificar formato da mensagem
  - [ ] Testar com múltiplos aniversariantes
  - [ ] Testar quando não há aniversários
  - [ ] Verificar logs

---

## 🔧 Ajustes e Melhorias

### Enviar para Múltiplos Coordenadores
```php
$coordinators = explode(',', env('BIRTHDAY_COORDINATOR_PHONES', ''));
foreach ($coordinators as $phone) {
    $this->whatsappService->sendMessage(trim($phone), $message);
}
```

### Enviar com Antecedência Configurável
```php
// Enviar 2 dias antes
$targetDate = Carbon::tomorrow()->addDays(1);
```

### Incluir Foto/Imagem
```php
// Usar sendMedia ao invés de sendText
$response = Http::post("{$this->apiUrl}/message/sendMedia/{$this->instanceName}", [
    'number' => $phone,
    'mediatype' => 'image',
    'media' => 'https://exemplo.com/foto.jpg',
    'caption' => $message,
]);
```

### Tratamento de Erros Avançado
```php
// Retry automático
$maxRetries = 3;
for ($i = 0; $i < $maxRetries; $i++) {
    $result = $this->whatsappService->sendMessage($phone, $message);
    if ($result['success']) break;
    sleep(2); // Aguardar 2 segundos antes de tentar novamente
}
```

---

## 📚 Documentação de Referência

- **Evolution API Docs**: https://doc.evolution-api.com/
- **Laravel Scheduling**: https://laravel.com/docs/scheduling
- **Carbon (Datas)**: https://carbon.nesbot.com/docs/

---

## ⚠️ Observações Importantes

1. **Ano de Aniversário**: Decida como tratar anos (usar ano fixo 2000 ou ignorar ano)
2. **Fuso Horário**: Configure timezone corretamente no scheduler
3. **Rate Limiting**: Evolution API pode ter limites de envio
4. **Backup**: Mantenha backup da instância WhatsApp
5. **Logs**: Monitore logs para detectar falhas
6. **Testes**: Sempre teste antes de colocar em produção

---

## 🎯 Resultado Esperado

Todos os dias às 08:00, o sistema:
1. ✅ Verifica quem faz aniversário no dia seguinte
2. ✅ Formata mensagem com lista de aniversariantes
3. ✅ Envia WhatsApp para o coordenador
4. ✅ Registra log da operação
5. ✅ Trata erros e falhas graciosamente

---

**Pronto para implementar! 🚀**




