# 🔧 Corrigir Rota de Clientes

## ❌ Problema

```
ERROR  ❌ API Error: Cuidador não encontrado
ERROR  API Error: {"errors": {}, "message": "Cuidador não encontrado", "status": 404}
```

A rota `/caregivers/clients` não está registrada. O Laravel está interpretando como `/caregivers/{id}` onde `id = "clients"`, e então chama o método `show` que procura por um cuidador com id "clients".

## ✅ Solução

As rotas mais específicas (`/caregivers/clients`) devem vir **ANTES** das rotas com parâmetros (`/caregivers/{id}`).

### Execute no servidor:

```bash
ssh darley@192.168.0.20
sudo bash /tmp/CORRIGIR_ROTAS_CLIENTES.sh
```

### Ou manualmente:

1. **Editar `routes/api.php`:**

Localize a seção:
```php
    // ==================== CUIDADORES PROFISSIONAIS ====================
    
    Route::get('/caregivers', [CaregiverController::class, 'index']);
    Route::get('/caregivers/{id}', [CaregiverController::class, 'show']);
    Route::post('/caregivers/{id}/reviews', [CaregiverController::class, 'createReview']);
```

E substitua por:
```php
    // ==================== CUIDADORES PROFISSIONAIS ====================
    
    // IMPORTANTE: Rotas mais específicas devem vir ANTES das rotas com parâmetros
    Route::get('/caregivers/clients', [CaregiverController::class, 'getClients']);
    Route::get('/caregivers/clients/{id}', [CaregiverController::class, 'getClientDetails']);
    Route::post('/caregivers/clients/{id}/reviews', [CaregiverController::class, 'createClientReview']);
    
    // Rotas gerais de cuidadores (devem vir depois das rotas específicas)
    Route::get('/caregivers', [CaregiverController::class, 'index']);
    Route::get('/caregivers/{id}', [CaregiverController::class, 'show']);
    Route::post('/caregivers/{id}/reviews', [CaregiverController::class, 'createReview']);
```

2. **Atualizar controller:**
```bash
sudo cp /tmp/CaregiverController_REVIEW.php app/Http/Controllers/Api/CaregiverController.php
sudo chown www-data:www-data app/Http/Controllers/Api/CaregiverController.php
```

3. **Limpar cache:**
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

4. **Verificar:**
```bash
php artisan route:list | grep clients
```

Deve mostrar:
```
GET|HEAD  api/caregivers/clients ................. caregivers.getClients
GET|HEAD  api/caregivers/clients/{id} ............ caregivers.getClientDetails
POST      api/caregivers/clients/{id}/reviews .... caregivers.createClientReview
```

## ✅ Após corrigir

A rota `/caregivers/clients` deve funcionar corretamente e retornar a lista de clientes (admins dos grupos) do cuidador profissional.

