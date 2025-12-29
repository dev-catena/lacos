# 🚀 Instalação do Backend - Mídias e Alertas

## 📋 Pré-requisitos

- PHP 8.1 ou superior
- Laravel 9+ ou 10+
- MySQL 5.7+ ou PostgreSQL
- Composer
- Storage configurado (local ou S3)

---

## 📂 Estrutura de Arquivos

Copie os arquivos para seu projeto Laravel:

```
backend-laravel/
├── MediaController.php          → app/Http/Controllers/Api/
├── AlertController.php          → app/Http/Controllers/Api/
├── GroupMedia.php               → app/Models/
├── PatientAlert.php             → app/Models/
├── create_group_media_table.php → database/migrations/
├── create_patient_alerts_table.php → database/migrations/
└── api_routes.php               → adicionar em routes/api.php
```

---

## ⚙️ Passo a Passo de Instalação

### 1. Copiar Controllers

```bash
# Criar diretório se não existe
mkdir -p app/Http/Controllers/Api

# Copiar controllers
cp backend-laravel/MediaController.php app/Http/Controllers/Api/
cp backend-laravel/AlertController.php app/Http/Controllers/Api/
```

### 2. Copiar Models

```bash
cp backend-laravel/GroupMedia.php app/Models/
cp backend-laravel/PatientAlert.php app/Models/
```

### 3. Criar Migrations

```bash
# Criar migrations com timestamp correto
php artisan make:migration create_group_media_table
php artisan make:migration create_patient_alerts_table

# Copiar conteúdo dos arquivos para as migrations criadas
# Ou renomear os arquivos fornecidos com o timestamp correto:
# YYYY_MM_DD_HHMMSS_create_group_media_table.php
```

### 4. Adicionar Rotas

Adicione as rotas do arquivo `api_routes.php` no seu `routes/api.php`:

```php
// Em routes/api.php

use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\AlertController;

// Cole as rotas do arquivo api_routes.php aqui
```

### 5. Configurar Storage

Adicione no `.env`:

```env
# Storage
FILESYSTEM_DISK=public

# Para produção, configure S3:
# FILESYSTEM_DISK=s3
# AWS_ACCESS_KEY_ID=your-key
# AWS_SECRET_ACCESS_KEY=your-secret
# AWS_DEFAULT_REGION=us-east-1
# AWS_BUCKET=your-bucket
```

Criar link simbólico do storage:

```bash
php artisan storage:link
```

### 6. Rodar Migrations

```bash
php artisan migrate
```

### 7. Middleware de Proteção para Cron

Crie um middleware para proteger as rotas de cron:

```bash
php artisan make:middleware ProtectCronRoutes
```

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ProtectCronRoutes
{
    public function handle(Request $request, Closure $next)
    {
        $allowedToken = config('app.cron_token');
        $requestToken = $request->header('X-Cron-Token');

        if ($requestToken !== $allowedToken) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return $next($request);
    }
}
```

Registrar no `app/Http/Kernel.php`:

```php
protected $routeMiddleware = [
    // ...
    'cron.protected' => \App\Http\Middleware\ProtectCronRoutes::class,
];
```

Adicionar token no `.env`:

```env
CRON_TOKEN=seu-token-secreto-aqui
```

---

## 🕐 Configurar Cron Jobs

### Linux/Mac (crontab)

```bash
crontab -e
```

Adicionar:

```bash
# Limpar mídias antigas (a cada hora)
0 * * * * curl -H "X-Cron-Token: seu-token" https://seudominio.com/api/cron/media/clean

# Gerar alertas de medicamentos (a cada minuto)
* * * * * curl -H "X-Cron-Token: seu-token" https://seudominio.com/api/cron/alerts/generate-medications

# Limpar alertas expirados (a cada hora)
0 * * * * curl -H "X-Cron-Token: seu-token" https://seudominio.com/api/cron/alerts/clean-expired
```

### Laravel Scheduler (Recomendado)

Em `app/Console/Kernel.php`:

```php
protected function schedule(Schedule $schedule)
{
    // Limpar mídias antigas
    $schedule->call(function () {
        app(MediaController::class)->cleanOldMedia();
    })->hourly();

    // Gerar alertas de medicamentos
    $schedule->call(function () {
        app(AlertController::class)->generateMedicationAlerts();
    })->everyMinute();

    // Limpar alertas expirados
    $schedule->call(function () {
        app(AlertController::class)->cleanExpiredAlerts();
    })->hourly();
}
```

Adicionar no crontab:

```bash
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

---

## 🧪 Testar os Endpoints

### 1. Listar Mídias

```bash
curl -X GET "https://seudominio.com/api/groups/1/media" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 2. Postar Mídia

```bash
curl -X POST "https://seudominio.com/api/groups/1/media" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "type=image" \
  -F "description=Teste de upload"
```

### 3. Listar Alertas

```bash
curl -X GET "https://seudominio.com/api/groups/1/alerts/active" \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

## 📊 Verificar Funcionalidade

### No Laravel Tinker

```bash
php artisan tinker
```

```php
// Verificar mídias
\App\Models\GroupMedia::count();
\App\Models\GroupMedia::recent()->get();

// Verificar alertas
\App\Models\PatientAlert::active()->count();
\App\Models\PatientAlert::medication()->get();
```

---

## 🔒 Permissões de Segurança

### Storage

```bash
chmod -R 775 storage
chmod -R 775 bootstrap/cache
chown -R www-data:www-data storage
chown -R www-data:www-data bootstrap/cache
```

### Validar Uploads

Os controllers já incluem validação de:
- ✅ Tipos de arquivo permitidos
- ✅ Tamanho máximo
- ✅ Permissões do usuário
- ✅ Proteção contra uploads maliciosos

---

## 📝 Logs

Os logs são gravados automaticamente em `storage/logs/laravel.log`

Para monitorar em tempo real:

```bash
tail -f storage/logs/laravel.log | grep -i "media\|alert"
```

---

## ⚠️ Troubleshooting

### Erro: "No application encryption key"

```bash
php artisan key:generate
```

### Erro: "Target class [MediaController] does not exist"

Verifique o namespace e importações no topo dos controllers.

### Erro: "Storage link not found"

```bash
php artisan storage:link
```

### Uploads não funcionam

Verificar permissões:

```bash
ls -la storage/app/public
```

---

## 🚀 Produção

### Otimizar

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize
```

### Configurar CORS

Se necessário, configure CORS em `config/cors.php`

### SSL

Certifique-se de que seu domínio tem HTTPS ativo.

---

## 📱 Integração com App

Após instalação, o app React Native conectará automaticamente aos endpoints e:

✅ Carregará mídias reais do backend
✅ Exibirá alertas gerados automaticamente
✅ Permitirá upload de fotos e vídeos
✅ Sincronizará medicamentos tomados

---

## 🆘 Suporte

Se encontrar problemas:
1. Verificar logs: `storage/logs/laravel.log`
2. Testar endpoints manualmente
3. Verificar permissões de arquivos
4. Validar conexão com banco de dados

---

**Instalação completa! Seu backend está pronto.** ✅

