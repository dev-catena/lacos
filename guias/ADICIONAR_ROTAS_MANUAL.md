# 🔧 Adicionar Rotas de Cuidadores Profissionais - INSTRUÇÕES MANUAIS

## ❌ Erro Atual

```
ERROR  API Error: The route api/caregivers could not be found. (404)
```

## ✅ Solução - Execute no Servidor

### Passo 1: Conectar ao servidor
```bash
ssh darley@10.102.0.103
cd /var/www/lacos-backend
```

### Passo 2: Copiar arquivos (com sudo)
```bash
sudo cp /tmp/CaregiverController.php app/Http/Controllers/Api/CaregiverController.php
sudo cp /tmp/CaregiverCourse.php app/Models/CaregiverCourse.php
sudo cp /tmp/CaregiverReview.php app/Models/CaregiverReview.php
sudo chown www-data:www-data app/Http/Controllers/Api/CaregiverController.php app/Models/CaregiverCourse.php app/Models/CaregiverReview.php
```

### Passo 3: Editar `routes/api.php`

**3.1. Adicionar import (após linha ~19):**

Localize:
```php
use App\Http\Controllers\Api\PopularPharmacyController;
```

E adicione logo abaixo:
```php
use App\Http\Controllers\Api\CaregiverController;
```

**3.2. Adicionar rotas (antes do último `});`):**

Localize a linha (deve estar perto do final do arquivo):
```php
    Route::post('/alerts/{alertId}/dismiss', [AlertController::class, 'dismissAlert']);
    
});
```

E substitua por:
```php
    Route::post('/alerts/{alertId}/dismiss', [AlertController::class, 'dismissAlert']);
    
    // Cuidadores Profissionais
    Route::get('/caregivers', [CaregiverController::class, 'index']);
    Route::get('/caregivers/{id}', [CaregiverController::class, 'show']);
    Route::post('/caregivers/{id}/reviews', [CaregiverController::class, 'createReview']);
    
});
```

### Passo 4: Limpar cache
```bash
php artisan route:clear
php artisan config:clear
```

### Passo 5: Verificar
```bash
php artisan route:list | grep caregivers
```

Deve mostrar:
```
GET|HEAD  api/caregivers ................. caregivers.index
GET|HEAD  api/caregivers/{id} ............ caregivers.show
POST      api/caregivers/{id}/reviews .... caregivers.createReview
```

## ✅ Pronto!

Após isso, a lista de cuidadores no app deve funcionar corretamente.

