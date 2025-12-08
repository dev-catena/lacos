# 🔌 Configuração de WebSocket com Laravel Broadcasting

## 📋 Visão Geral

Este sistema usa Laravel Broadcasting nativo para atualizar a interface do paciente em tempo real quando mídias são criadas ou deletadas.

## 🚀 Instalação

### 1. Instalar Dependências

```bash
composer require pusher/pusher-php-server
# OU para usar Laravel Reverb (Laravel 11+)
composer require laravel/reverb
```

### 2. Configurar Broadcasting

#### Opção A: Usar Pusher (Recomendado para produção)

No arquivo `.env`:

```env
BROADCAST_DRIVER=pusher

PUSHER_APP_ID=your-app-id
PUSHER_APP_KEY=your-app-key
PUSHER_APP_SECRET=your-app-secret
PUSHER_APP_CLUSTER=us2
```

#### Opção B: Usar Laravel Reverb (Laravel 11+)

No arquivo `.env`:

```env
BROADCAST_DRIVER=reverb

REVERB_APP_ID=your-app-id
REVERB_APP_KEY=your-app-key
REVERB_APP_SECRET=your-app-secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http
```

### 3. Configurar `config/broadcasting.php`

Certifique-se de que o driver está configurado corretamente:

```php
'connections' => [
    'pusher' => [
        'driver' => 'pusher',
        'key' => env('PUSHER_APP_KEY'),
        'secret' => env('PUSHER_APP_SECRET'),
        'app_id' => env('PUSHER_APP_ID'),
        'options' => [
            'cluster' => env('PUSHER_APP_CLUSTER'),
            'encrypted' => true,
        ],
    ],
    
    'reverb' => [
        'driver' => 'reverb',
        'key' => env('REVERB_APP_KEY'),
        'secret' => env('REVERB_APP_SECRET'),
        'app_id' => env('REVERB_APP_ID'),
        'options' => [
            'host' => env('REVERB_HOST', '127.0.0.1'),
            'port' => env('REVERB_PORT', 8080),
            'scheme' => env('REVERB_SCHEME', 'http'),
        ],
    ],
],
```

### 4. Iniciar Servidor WebSocket

#### Se usar Pusher:
- Não precisa iniciar servidor (Pusher é cloud)

#### Se usar Reverb:
```bash
php artisan reverb:start
```

### 5. Configurar Queue (Opcional mas Recomendado)

Para melhor performance, configure queue para broadcasting:

```env
QUEUE_CONNECTION=database
# ou
QUEUE_CONNECTION=redis
```

E execute o worker:

```bash
php artisan queue:work
```

## 📡 Eventos Disponíveis

### `media.deleted`
Disparado quando uma mídia é deletada.

**Canal:** `group.{groupId}`

**Payload:**
```json
{
  "group_id": 1,
  "media_id": 123
}
```

### `media.created`
Disparado quando uma nova mídia é criada.

**Canal:** `group.{groupId}`

**Payload:**
```json
{
  "group_id": 1,
  "media": {
    "id": 123,
    "group_id": 1,
    "type": "video",
    "url": "...",
    "created_at": "..."
  }
}
```

## 🔐 Autenticação

Os canais são privados e requerem autenticação. O Laravel verifica automaticamente se o usuário é membro do grupo antes de permitir a conexão.

## 🧪 Testar

1. Abra o app do paciente em um dispositivo
2. Abra o app do cuidador em outro dispositivo
3. Delete uma mídia no app do cuidador
4. A mídia deve desaparecer imediatamente no app do paciente

## 📝 Notas

- Os eventos são broadcasted apenas para membros do grupo
- A autenticação é feita via Sanctum token
- Os canais são privados por padrão







