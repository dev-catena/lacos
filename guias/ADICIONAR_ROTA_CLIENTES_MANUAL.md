# 🔧 Adicionar Rota de Clientes - Instruções Manuais

## ❌ Erro Atual

```
ERROR  ❌ API Error: The route api/caregivers/clients could not be found.
```

## ✅ Solução Manual

Execute no servidor:

```bash
ssh darley@10.102.0.103
cd /var/www/lacos-backend
```

### 1. Fazer backup
```bash
sudo cp routes/api.php routes/api.php.bak
```

### 2. Editar routes/api.php

Abra o arquivo:
```bash
sudo nano routes/api.php
```

### 3. Adicionar import (se não existir)

Procure por uma linha como:
```php
use App\Http\Controllers\Api\PopularPharmacyController;
```

E adicione logo abaixo:
```php
use App\Http\Controllers\Api\CaregiverController;
```

### 4. Adicionar rotas de clientes

Procure pela seção:
```php
    // ==================== CUIDADORES PROFISSIONAIS ====================
    
    Route::get('/caregivers', [CaregiverController::class, 'index']);
    Route::get('/caregivers/{id}', [CaregiverController::class, 'show']);
    Route::post('/caregivers/{id}/reviews', [CaregiverController::class, 'createReview']);
```

**IMPORTANTE:** As rotas mais específicas devem vir ANTES das rotas com parâmetros.

Substitua por:
```php
    // ==================== CUIDADORES PROFISSIONAIS ====================
    
    // Rotas de clientes (devem vir ANTES de /caregivers/{id})
    Route::get('/caregivers/clients', [CaregiverController::class, 'getClients']);
    Route::get('/caregivers/clients/{id}', [CaregiverController::class, 'getClientDetails']);
    Route::post('/caregivers/clients/{id}/reviews', [CaregiverController::class, 'createClientReview']);
    
    // Rotas gerais de cuidadores
    Route::get('/caregivers', [CaregiverController::class, 'index']);
    Route::get('/caregivers/{id}', [CaregiverController::class, 'show']);
    Route::post('/caregivers/{id}/reviews', [CaregiverController::class, 'createReview']);
```

### 5. Salvar e sair
- Pressione `Ctrl+O` para salvar
- Pressione `Enter` para confirmar
- Pressione `Ctrl+X` para sair

### 6. Atualizar controller
```bash
sudo cp /tmp/CaregiverController_REVIEW.php app/Http/Controllers/Api/CaregiverController.php
sudo chown www-data:www-data app/Http/Controllers/Api/CaregiverController.php
```

### 7. Limpar cache
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

### 8. Verificar
```bash
php artisan route:list | grep clients
```

Deve mostrar:
```
GET|HEAD  api/caregivers/clients ................. caregivers.getClients
GET|HEAD  api/caregivers/clients/{id} ............ caregivers.getClientDetails
POST      api/caregivers/clients/{id}/reviews .... caregivers.createClientReview
```

## ✅ Pronto!

Após isso, a rota `/caregivers/clients` deve funcionar corretamente.

