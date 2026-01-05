# 🎬 Backend - Sistema de Mídias e Alertas

Backend Laravel para suporte aos recursos de **Mídias Compartilhadas** e **Alertas Inteligentes** do aplicativo de cuidados ao paciente.

---

## 📦 O que está incluído

### Controllers
- ✅ **MediaController** - Gerencia mídias (upload, listagem, deleção)
- ✅ **AlertController** - Gerencia alertas ativos e ações

### Models
- ✅ **GroupMedia** - Modelo para mídias do grupo
- ✅ **PatientAlert** - Modelo para alertas do paciente

### Migrations
- ✅ **create_group_media_table** - Tabela de mídias
- ✅ **create_patient_alerts_table** - Tabela de alertas

### Rotas API
- ✅ Endpoints RESTful completos
- ✅ Proteção com autenticação Sanctum
- ✅ Rotas para cron jobs

---

## 🚀 Instalação Rápida

### Opção 1: Script Automático

```bash
cd /path/to/seu-projeto-laravel
chmod +x ../lacos/backend-laravel/install.sh
../lacos/backend-laravel/install.sh
```

### Opção 2: Manual

Siga as instruções em: **[INSTALACAO_BACKEND.md](./INSTALACAO_BACKEND.md)**

---

## 📋 Endpoints Implementados

### Mídias

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/groups/{id}/media` | Listar mídias (últimas 24h) |
| POST | `/api/groups/{id}/media` | Postar nova mídia |
| DELETE | `/api/media/{id}` | Deletar mídia |

### Alertas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/groups/{id}/alerts/active` | Listar alertas ativos |
| POST | `/api/alerts/{id}/taken` | Marcar medicamento tomado |
| POST | `/api/alerts/{id}/dismiss` | Dispensar alerta |

### Cron Jobs

| Método | Endpoint | Frequência | Descrição |
|--------|----------|------------|-----------|
| GET | `/api/cron/media/clean` | A cada hora | Limpar mídias antigas |
| GET | `/api/cron/alerts/generate-medications` | A cada minuto | Gerar alertas de medicamentos |
| GET | `/api/cron/alerts/clean-expired` | A cada hora | Limpar alertas expirados |

---

## 🔐 Autenticação

Todos os endpoints (exceto cron) requerem autenticação via Laravel Sanctum:

```bash
Authorization: Bearer {TOKEN}
```

---

## 💾 Estrutura do Banco de Dados

### Tabela: `group_media`

```sql
- id (PK)
- group_id (FK)
- posted_by_user_id (FK)
- type (enum: 'image', 'video')
- file_path (string)
- url (string)
- thumbnail_url (string, nullable)
- description (text, nullable)
- created_at
- updated_at
- deleted_at (soft delete)
```

### Tabela: `patient_alerts`

```sql
- id (PK)
- group_id (FK)
- patient_user_id (FK)
- type (enum: 'medication', 'appointment', 'vital_signs', 'sedentary')
- message (text)
- details (text, nullable)
- medication_id, medication_name, dosage (nullable)
- appointment_id, appointment_type, location (nullable)
- vital_sign_type, value, normal_range (nullable)
- is_active (boolean)
- priority (tinyint)
- time, expires_at, dismissed_at, taken_at (timestamps)
- created_at, updated_at
```

---

## 🧪 Exemplos de Uso

### 1. Listar Mídias

**Request:**
```bash
GET /api/groups/18/media
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": 1,
    "group_id": 18,
    "type": "image",
    "url": "https://storage.example.com/media/abc123.jpg",
    "description": "Momento especial",
    "posted_by_name": "João Silva",
    "created_at": "2025-11-28T10:30:00Z"
  }
]
```

### 2. Postar Mídia

**Request:**
```bash
POST /api/groups/18/media
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [binary data]
type: "image"
description: "Nova foto"
```

**Response:**
```json
{
  "id": 2,
  "group_id": 18,
  "type": "image",
  "url": "https://storage.example.com/media/xyz789.jpg",
  "posted_by_name": "Maria Santos",
  "created_at": "2025-11-28T14:15:00Z"
}
```

### 3. Listar Alertas

**Request:**
```bash
GET /api/groups/18/alerts/active
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": 1,
    "type": "medication",
    "message": "Hora de tomar seu medicamento!",
    "medication_name": "Losartana 50mg",
    "dosage": "1 comprimido",
    "time": "2025-11-28T08:00:00Z",
    "is_active": true
  }
]
```

---

## 🕐 Configuração de Cron Jobs

### Laravel Scheduler (Recomendado)

Adicione em `app/Console/Kernel.php`:

```php
protected function schedule(Schedule $schedule)
{
    // Limpar mídias antigas
    $schedule->call(function () {
        app(MediaController::class)->cleanOldMedia();
    })->hourly();

    // Gerar alertas
    $schedule->call(function () {
        app(AlertController::class)->generateMedicationAlerts();
    })->everyMinute();

    // Limpar alertas expirados
    $schedule->call(function () {
        app(AlertController::class)->cleanExpiredAlerts();
    })->hourly();
}
```

Configure o crontab:

```bash
* * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1
```

---

## 📊 Monitoramento

### Logs

```bash
tail -f storage/logs/laravel.log | grep -i "media\|alert"
```

### Verificar Status

```bash
php artisan tinker
```

```php
// Contar mídias
\App\Models\GroupMedia::count();

// Mídias recentes
\App\Models\GroupMedia::recent()->count();

// Alertas ativos
\App\Models\PatientAlert::active()->count();
```

---

## 🔒 Segurança

✅ **Validação de uploads** - Tipos e tamanhos permitidos
✅ **Autenticação obrigatória** - Sanctum
✅ **Verificação de permissões** - Admin do grupo
✅ **Proteção CSRF** - Nativa do Laravel
✅ **SQL Injection** - Eloquent ORM
✅ **XSS** - Blade templates

---

## 📚 Documentação Completa

- **[INSTALACAO_BACKEND.md](./INSTALACAO_BACKEND.md)** - Guia detalhado de instalação
- **[BACKEND_API_ENDPOINTS.md](../BACKEND_API_ENDPOINTS.md)** - Especificação completa da API

---

## 🆘 Troubleshooting

### Erro de Upload

```bash
# Verificar permissões
chmod -R 775 storage
chown -R www-data:www-data storage

# Recriar link
php artisan storage:link
```

### Cron Jobs não executam

```bash
# Verificar crontab
crontab -l

# Testar manualmente
php artisan schedule:run
```

### Alertas não são gerados

```bash
# Verificar medicamentos
php artisan tinker
\App\Models\Medication::whereNotNull('schedule')->count();
```

---

## 🚀 Deploy em Produção

### Checklist

- [ ] Configurar variáveis de ambiente (`.env`)
- [ ] Rodar migrations (`php artisan migrate`)
- [ ] Configurar storage (S3 recomendado)
- [ ] Configurar cron jobs
- [ ] Otimizar cache (`php artisan optimize`)
- [ ] Configurar SSL/HTTPS
- [ ] Configurar CORS
- [ ] Monitorar logs

### Performance

```bash
# Otimizar
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Monitorar
php artisan horizon (se usar Redis)
```

---

## 📱 Integração com App React Native

Após instalação, o app automaticamente:

✅ Carregará mídias reais do backend
✅ Exibirá alertas gerados
✅ Permitirá upload de fotos/vídeos
✅ Sincronizará medicamentos

**Status:** Frontend já está implementado e aguardando backend ativo!

---

## 📞 Suporte

Dúvidas? Verifique:
1. Logs: `storage/logs/laravel.log`
2. Status do servidor: `php artisan serve`
3. Conexão com DB: `php artisan tinker`
4. Documentação Laravel: https://laravel.com/docs

---

**Backend pronto para produção!** 🎉✅

