# 🔧 Correção Manual da Rota Admin Login

## Problema
O arquivo `routes/api.php` tem um import mal formatado.

## Solução Rápida

Execute no servidor:

```bash
cd /var/www/lacos-backend

# Corrigir o import
sed -i 's/use AppHttpControllersApiAdminAuthController;/use App\\Http\\Controllers\\Api\\AdminAuthController;/g' routes/api.php

# OU editar manualmente
nano routes/api.php
```

O arquivo deve ter:

```php
<?php

use App\Http\Controllers\Api\AdminAuthController;
use Illuminate\Support\Facades\Route;

Route::post('/admin/login', [AdminAuthController::class, 'login']);
Route::middleware('auth:sanctum')->post('/admin/logout', [AdminAuthController::class, 'logout']);
```

## Ou recriar o arquivo

```bash
cd /var/www/lacos-backend

cat > routes/api.php << 'EOF'
<?php

use App\Http\Controllers\Api\AdminAuthController;
use Illuminate\Support\Facades\Route;

// Login Admin/Root - Rota pública
Route::post('/admin/login', [AdminAuthController::class, 'login']);

// Logout Admin - Requer autenticação
Route::middleware('auth:sanctum')->post('/admin/logout', [AdminAuthController::class, 'logout']);
EOF

# Limpar cache
php artisan route:clear
php artisan config:clear

# Verificar
php artisan route:list | grep admin/login
```

