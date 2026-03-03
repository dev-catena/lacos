# 🔧 Adicionar Rota de Clientes - Método Simples

## ❌ Erro

O script não encontrou a linha. Vamos fazer manualmente de forma mais simples.

## ✅ Solução Simples

Execute no servidor:

```bash
ssh darley@192.168.0.20
cd /var/www/lacos-backend
```

### 1. Verificar o arquivo atual
```bash
grep -n "caregivers" routes/api.php
```

Isso mostrará onde estão as rotas de cuidadores.

### 2. Editar o arquivo
```bash
sudo nano routes/api.php
```

### 3. Procurar pela seção de cuidadores

Use `Ctrl+W` para buscar por "caregivers" ou "CUIDADORES PROFISSIONAIS"

### 4. Adicionar as rotas ANTES das rotas existentes

Encontre algo como:
```php
Route::get('/caregivers', [CaregiverController::class, 'index']);
```

E adicione ANTES dessa linha:
```php
    // Rotas de clientes (devem vir ANTES de /caregivers/{id})
    Route::get('/caregivers/clients', [CaregiverController::class, 'getClients']);
    Route::get('/caregivers/clients/{id}', [CaregiverController::class, 'getClientDetails']);
    Route::post('/caregivers/clients/{id}/reviews', [CaregiverController::class, 'createClientReview']);
    
```

### 5. Verificar se o import existe

Procure por:
```php
use App\Http\Controllers\Api\CaregiverController;
```

Se não existir, adicione após os outros imports de controllers.

### 6. Salvar (Ctrl+O, Enter, Ctrl+X)

### 7. Limpar cache
```bash
php artisan route:clear
php artisan config:clear
php artisan cache:clear
```

### 8. Verificar
```bash
php artisan route:list | grep clients
```

## ✅ Pronto!

A rota `/caregivers/clients` deve funcionar agora.

