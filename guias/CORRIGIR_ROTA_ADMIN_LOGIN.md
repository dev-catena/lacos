# 🔧 Corrigir Rota /api/admin/login

## Problema
A rota `/api/admin/login` não está sendo encontrada.

## Soluções

### Opção 1: Adicionar rota diretamente no arquivo de rotas usado

No servidor, verifique qual arquivo de rotas está sendo usado:

```bash
cd /var/www/lacos-backend
grep -r "Route::post.*login" routes/ app/Providers/
```

### Opção 2: Adicionar no RouteServiceProvider

Se o Laravel estiver usando um RouteServiceProvider customizado, adicione:

```php
// Em app/Providers/RouteServiceProvider.php
Route::middleware('api')
    ->prefix('api')
    ->group(base_path('routes/api.php'));
```

### Opção 3: Adicionar diretamente no arquivo de rotas principal

Se houver um arquivo como `routes/web.php` ou arquivo customizado, adicione:

```php
use App\Http\Controllers\Api\AdminAuthController;

// Login Admin/Root
Route::post('/api/admin/login', [AdminAuthController::class, 'login']);
```

### Opção 4: Verificar se o AdminAuthController existe

```bash
cd /var/www/lacos-backend
ls -la app/Http/Controllers/Api/AdminAuthController.php
```

Se não existir, execute:
```bash
sudo bash /tmp/INSTALAR_ADMIN_AUTH.sh
```

### Opção 5: Adicionar rota diretamente (Solução Rápida)

Execute no servidor:

```bash
cd /var/www/lacos-backend

# Criar routes/api.php se não existir
mkdir -p routes
cat > routes/api.php << 'EOF'
<?php

use App\Http\Controllers\Api\AdminAuthController;
use Illuminate\Support\Facades\Route;

Route::post('/admin/login', [AdminAuthController::class, 'login']);
Route::middleware('auth:sanctum')->post('/admin/logout', [AdminAuthController::class, 'logout']);
EOF

# Verificar RouteServiceProvider
grep -A 5 "api" app/Providers/RouteServiceProvider.php || echo "RouteServiceProvider pode não estar configurado"
```

### Opção 6: Adicionar no bootstrap/app.php (Laravel 11+)

Se estiver usando Laravel 11, adicione em `bootstrap/app.php`:

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->api(prepend: [
        // ...
    ]);
})
->withRouting(function (Routing $routing) {
    $routing->group(base_path('routes/api.php'));
});
```

## Verificar se funcionou

```bash
php artisan route:list | grep admin/login
```

Deve mostrar:
```
POST   api/admin/login ................ AdminAuthController@login
```

