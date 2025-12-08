# 🔧 Solução: Rotas de Cuidadores Profissionais

## ❌ Erro

```
ERROR  API Error: The route api/caregivers could not be found. (404)
```

## ✅ Solução Rápida

Execute no servidor:

```bash
ssh darley@193.203.182.22
cd /var/www/lacos-backend

# Executar script completo
bash /tmp/fix_caregivers_routes.sh
```

## 📝 Solução Manual (se o script não funcionar)

### 1. Copiar arquivos

```bash
cd /var/www/lacos-backend

# Controller
sudo cp /tmp/CaregiverController.php app/Http/Controllers/Api/CaregiverController.php
sudo chown www-data:www-data app/Http/Controllers/Api/CaregiverController.php

# Models
sudo cp /tmp/CaregiverCourse.php app/Models/CaregiverCourse.php
sudo cp /tmp/CaregiverReview.php app/Models/CaregiverReview.php
sudo chown www-data:www-data app/Models/CaregiverCourse.php app/Models/CaregiverReview.php
```

### 2. Editar `routes/api.php`

**Adicionar import (após linha 19, após PopularPharmacyController):**
```php
use App\Http\Controllers\Api\CaregiverController;
```

**Adicionar rotas (antes da última linha `});` que fecha o middleware `auth:sanctum`):**

Localize a linha:
```php
    Route::post('/alerts/{alertId}/dismiss', [AlertController::class, 'dismissAlert']);
    
});
```

E adicione ANTES do `});`:
```php
    Route::post('/alerts/{alertId}/dismiss', [AlertController::class, 'dismissAlert']);
    
    // Cuidadores Profissionais
    Route::get('/caregivers', [CaregiverController::class, 'index']);
    Route::get('/caregivers/{id}', [CaregiverController::class, 'show']);
    Route::post('/caregivers/{id}/reviews', [CaregiverController::class, 'createReview']);
    
});
```

### 3. Limpar cache

```bash
php artisan route:clear
php artisan config:clear
```

### 4. Verificar

```bash
php artisan route:list | grep caregivers
```

Deve mostrar as 3 rotas listadas acima.

