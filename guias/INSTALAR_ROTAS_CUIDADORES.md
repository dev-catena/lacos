# 🚀 Instalar Rotas de Cuidadores Profissionais

## ❌ Erro Atual

```
ERROR  API Error: The route api/caregivers could not be found. (404)
```

## ✅ Solução Rápida

Execute no servidor:

```bash
ssh darley@192.168.0.20
cd /var/www/lacos-backend

# 1. Copiar Controller e Models
sudo cp /tmp/CaregiverController.php app/Http/Controllers/Api/CaregiverController.php
sudo cp /tmp/CaregiverCourse.php app/Models/CaregiverCourse.php
sudo cp /tmp/CaregiverReview.php app/Models/CaregiverReview.php
sudo chown www-data:www-data app/Http/Controllers/Api/CaregiverController.php app/Models/CaregiverCourse.php app/Models/CaregiverReview.php

# 2. Adicionar rotas
bash /tmp/add_routes_manual.sh

# OU fazer manualmente (ver abaixo)
```

## 📝 Adicionar Rotas Manualmente

### 1. Editar `routes/api.php`

**Adicionar import (após linha ~19):**
```php
use App\Http\Controllers\Api\CaregiverController;
```

**Adicionar rotas (antes do fechamento `});` do middleware `auth:sanctum`):**
```php
// Cuidadores Profissionais
Route::get('/caregivers', [CaregiverController::class, 'index']);
Route::get('/caregivers/{id}', [CaregiverController::class, 'show']);
Route::post('/caregivers/{id}/reviews', [CaregiverController::class, 'createReview']);
```

### 2. Limpar cache
```bash
php artisan route:clear
php artisan config:clear
```

## ✅ Verificação

```bash
php artisan route:list | grep caregivers
```

Deve mostrar:
```
GET|HEAD  api/caregivers ................. caregivers.index
GET|HEAD  api/caregivers/{id} ............ caregivers.show
POST      api/caregivers/{id}/reviews .... caregivers.createReview
```

