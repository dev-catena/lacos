# 🔌 Configuração de WebSocket - Guia Completo

## 📋 O que foi implementado

Sistema de WebSocket usando Laravel Broadcasting nativo para atualizar a interface do paciente em tempo real quando mídias são criadas ou deletadas.

## ✅ Backend (Laravel)

### 1. Eventos Criados
- ✅ `MediaDeleted` - Disparado quando mídia é deletada
- ✅ `MediaCreated` - Disparado quando nova mídia é criada

### 2. Arquivos Criados
- ✅ `app/Events/MediaDeleted.php`
- ✅ `app/Events/MediaCreated.php`
- ✅ `routes/channels.php` - Canais de broadcasting

### 3. Integração no MediaController
- ✅ Evento disparado ao deletar mídia
- ✅ Evento disparado ao criar mídia

## ✅ Frontend (React Native)

### 1. Serviço WebSocket
- ✅ `src/services/websocketService.js` - Serviço para gerenciar conexões WebSocket

### 2. Integração nas Telas
- ✅ `PatientHomeScreen` - Escuta eventos e atualiza lista de mídias
- ✅ `MediaScreen` - Escuta eventos e atualiza lista de mídias

## 🚀 Como Configurar

### Passo 1: Backend - Instalar Dependências

```bash
cd backend-laravel
composer require pusher/pusher-php-server
```

### Passo 2: Backend - Configurar .env

Adicione no arquivo `.env`:

```env
BROADCAST_DRIVER=pusher

PUSHER_APP_ID=your-app-id
PUSHER_APP_KEY=your-app-key
PUSHER_APP_SECRET=your-app-secret
PUSHER_APP_CLUSTER=us2
```

**Para obter credenciais do Pusher:**
1. Acesse https://pusher.com
2. Crie uma conta gratuita
3. Crie um novo app
4. Copie as credenciais para o `.env`

### Passo 3: Frontend - Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto React Native:

```env
EXPO_PUBLIC_PUSHER_KEY=your-pusher-key
EXPO_PUBLIC_PUSHER_CLUSTER=us2
```

**Nota:** No Expo, variáveis de ambiente devem começar com `EXPO_PUBLIC_`

### Passo 4: Backend - Registrar Rotas de Broadcasting

Certifique-se de que `routes/channels.php` está sendo carregado. No Laravel, isso geralmente é feito automaticamente, mas verifique em `bootstrap/app.php` ou `app/Providers/BroadcastServiceProvider.php`.

### Passo 5: Testar

1. Inicie o servidor Laravel
2. Abra o app do paciente
3. Abra o app do cuidador
4. Delete uma mídia no app do cuidador
5. A mídia deve desaparecer imediatamente no app do paciente

## 🔧 Alternativa: Laravel Reverb (Laravel 11+)

Se você estiver usando Laravel 11+, pode usar Laravel Reverb (nativo) ao invés de Pusher:

### Backend:

```bash
composer require laravel/reverb
php artisan reverb:install
php artisan migrate
```

No `.env`:
```env
BROADCAST_DRIVER=reverb
REVERB_APP_ID=your-app-id
REVERB_APP_KEY=your-app-key
REVERB_APP_SECRET=your-app-secret
REVERB_HOST=localhost
REVERB_PORT=8080
```

Iniciar servidor:
```bash
php artisan reverb:start
```

### Frontend:

Atualizar `websocketService.js` para usar Socket.io ao invés de Pusher (requer ajustes no código).

## 📡 Eventos Disponíveis

### `media.deleted`
**Canal:** `private-group.{groupId}`

**Payload:**
```json
{
  "group_id": 1,
  "media_id": 123
}
```

### `media.created`
**Canal:** `private-group.{groupId}`

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

## 🐛 Troubleshooting

### WebSocket não conecta
- Verifique se as credenciais do Pusher estão corretas
- Verifique se o token de autenticação está sendo enviado
- Verifique os logs do Laravel para erros de autenticação

### Eventos não chegam
- Verifique se o canal está correto (`group.{groupId}`)
- Verifique se o usuário tem acesso ao grupo
- Verifique os logs do console do React Native

### Erro de autenticação
- Certifique-se de que `routes/channels.php` está verificando corretamente a autenticação
- Verifique se o token Sanctum está sendo enviado no header

## 📝 Notas Importantes

1. **Canais são privados** - Apenas membros do grupo podem escutar
2. **Autenticação automática** - Laravel verifica o token automaticamente
3. **Cleanup automático** - Listeners são removidos quando a tela perde foco
4. **Reconexão** - O serviço tenta reconectar automaticamente em caso de falha








