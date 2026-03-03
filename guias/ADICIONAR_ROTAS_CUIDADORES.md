# 🔧 Adicionar Rotas de Cuidadores Profissionais

## ❌ Problema

A rota `/api/caregivers` não foi encontrada (404). As rotas precisam ser adicionadas ao arquivo `routes/api.php`.

## 🚀 Solução

### Opção 1: Script Automatizado

```bash
ssh darley@192.168.0.20
cd /var/www/lacos-backend
bash /tmp/add_caregivers_routes.sh
```

### Opção 2: Manual

1. **Conectar ao servidor:**
```bash
ssh darley@192.168.0.20
cd /var/www/lacos-backend
```

2. **Fazer backup:**
```bash
sudo cp routes/api.php routes/api.php.bak
```

3. **Adicionar import do CaregiverController:**

Edite `routes/api.php` e adicione após os outros imports (linha ~19):
```php
use App\Http\Controllers\Api\CaregiverController;
```

4. **Adicionar rotas dentro do middleware `auth:sanctum`:**

Antes do fechamento `});` (antes da linha final), adicione:
```php
// Cuidadores Profissionais
Route::get('/caregivers', [CaregiverController::class, 'index']);
Route::get('/caregivers/{id}', [CaregiverController::class, 'show']);
Route::post('/caregivers/{id}/reviews', [CaregiverController::class, 'createReview']);
```

5. **Limpar cache:**
```bash
php artisan route:clear
php artisan config:clear
```

## ✅ Verificação

Após adicionar, teste:
```bash
curl -X GET "http://192.168.0.20/api/caregivers" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Accept: application/json"
```

## 📝 Nota

Certifique-se de que o `CaregiverController.php` existe em:
`app/Http/Controllers/Api/CaregiverController.php`

Se não existir, copie de `/tmp/CaregiverController.php`:
```bash
sudo cp /tmp/CaregiverController.php app/Http/Controllers/Api/CaregiverController.php
sudo chown www-data:www-data app/Http/Controllers/Api/CaregiverController.php
```

