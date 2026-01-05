# 🔧 Corrigir UserController - Salvar Dados de Cuidador Profissional

## ❌ Problema

Os dados cadastrados na tela "Dados Profissionais" do cuidador profissional não estão sendo salvos porque o `UserController` não está processando esses campos.

## ✅ Solução

### 1. Atualizar UserController

Execute no servidor:

```bash
cd /var/www/lacos-backend

# Fazer backup
sudo cp app/Http/Controllers/Api/UserController.php app/Http/Controllers/Api/UserController.php.bak

# Copiar versão corrigida
sudo cp /tmp/UserController_fixed.php app/Http/Controllers/Api/UserController.php
sudo chown www-data:www-data app/Http/Controllers/Api/UserController.php
```

### 2. Verificar se os campos estão no fillable do modelo User

Execute:

```bash
grep -E 'city|neighborhood|formation|hourly|availability|latitude|longitude' app/Models/User.php
```

Se não aparecerem, adicione ao array `$fillable`:

```php
protected $fillable = [
    // ... campos existentes ...
    'city',
    'neighborhood',
    'formation_details',
    'formation_description',
    'hourly_rate',
    'availability',
    'is_available',
    'latitude',
    'longitude',
];
```

### 3. Limpar cache

```bash
php artisan optimize:clear
```

## ✅ Após corrigir

Teste novamente salvando os dados na tela "Dados Profissionais" do cuidador. Os dados devem ser salvos corretamente e aparecer na lista de cuidadores.

