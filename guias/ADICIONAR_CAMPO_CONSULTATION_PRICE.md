# 🔧 Adicionar Campo consultation_price no Backend

## ❌ Problema

O campo `consultation_price` (valor da consulta) não está sendo persistido no perfil do médico porque o backend não está aceitando esse campo.

## ✅ Solução

### 1. Adicionar campo no Model User

Edite o arquivo `app/Models/User.php` e adicione `consultation_price` ao array `$fillable`:

```php
protected $fillable = [
    // ... campos existentes ...
    'crm',
    'medical_specialty_id',
    'consultation_price', // ← ADICIONAR ESTE CAMPO
    // ... outros campos ...
];
```

E adicione ao array `$casts` para garantir que seja tratado como decimal:

```php
protected $casts = [
    // ... casts existentes ...
    'consultation_price' => 'decimal:2', // ← ADICIONAR ESTE CAST
    // ... outros casts ...
];
```

### 2. Adicionar validação no UserController

Edite o arquivo `app/Http/Controllers/Api/UserController.php` e adicione `consultation_price` nas regras de validação:

```php
$rules = [
    // ... regras existentes ...
    // Campos de médico
    'crm' => 'sometimes|nullable|string|max:20',
    'medical_specialty_id' => 'sometimes|nullable|exists:medical_specialties,id',
    'consultation_price' => 'sometimes|nullable|numeric|min:0', // ← ADICIONAR ESTA REGRA
    // ... outras regras ...
];
```

E adicione `consultation_price` na lista de campos que são salvos no método `update`:

```php
$data = $request->only([
    // ... campos existentes ...
    'crm',
    'medical_specialty_id',
    'consultation_price', // ← ADICIONAR ESTE CAMPO
    // ... outros campos ...
]);
```

### 3. Criar Migration para adicionar coluna no banco

Execute no servidor:

```bash
cd /var/www/lacos-backend
php artisan make:migration add_consultation_price_to_users_table
```

Edite o arquivo de migration criado em `database/migrations/XXXX_XX_XX_XXXXXX_add_consultation_price_to_users_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('consultation_price', 10, 2)->nullable()->after('hourly_rate');
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('consultation_price');
        });
    }
};
```

Execute a migration:

```bash
php artisan migrate
```

### 4. Limpar cache

```bash
php artisan optimize:clear
```

## ✅ Após corrigir

1. Teste salvando o valor da consulta no perfil do médico
2. Verifique se o valor está sendo salvo corretamente
3. O valor deve aparecer quando você abrir a tela de dados profissionais novamente
4. O valor deve ser usado no cálculo do pagamento (valor + 20%)

## 📋 Verificação

Para verificar se o campo foi adicionado corretamente:

```bash
# Verificar se a coluna existe no banco
mysql -u root -p lacos -e "DESCRIBE users;" | grep consultation_price

# Verificar se está no fillable do modelo
grep -A 50 "protected \$fillable" app/Models/User.php | grep consultation_price

# Verificar se está nas regras de validação
grep consultation_price app/Http/Controllers/Api/UserController.php
```

