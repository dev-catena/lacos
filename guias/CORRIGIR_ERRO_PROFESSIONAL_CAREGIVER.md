# 🔧 Corrigir Erro ao Criar Cuidador Profissional

## 🐛 Problema

Ao tentar criar uma conta com perfil `professional_caregiver`, ocorre erro 500 do servidor.

## 🔍 Diagnóstico

A coluna `profile` existe na tabela `users`, mas pode ter uma constraint ENUM que não aceita o valor `professional_caregiver`.

## ✅ Solução

### Opção 1: Atualizar ENUM (se a coluna for ENUM)

Conecte-se ao servidor e execute:

```bash
ssh darley@192.168.0.20
cd /var/www/lacos-backend
```

Depois, acesse o banco de dados e execute:

```sql
-- Verificar o tipo atual da coluna
DESCRIBE users;
-- ou
SHOW COLUMNS FROM users WHERE Field = 'profile';

-- Se for ENUM, atualizar:
ALTER TABLE users MODIFY COLUMN profile ENUM('caregiver', 'accompanied', 'professional_caregiver') NULL;

-- Se for VARCHAR, garantir tamanho suficiente:
ALTER TABLE users MODIFY COLUMN profile VARCHAR(50) NULL;
```

### Opção 2: Criar Migration

1. Conecte-se ao servidor:
```bash
ssh darley@192.168.0.20
cd /var/www/lacos-backend
```

2. Crie uma migration:
```bash
php artisan make:migration update_profile_column_to_accept_professional_caregiver
```

3. Edite o arquivo criado em `database/migrations/`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Se a coluna for ENUM, precisamos alterar
        DB::statement("ALTER TABLE users MODIFY COLUMN profile ENUM('caregiver', 'accompanied', 'professional_caregiver') NULL");
        
        // Ou se for VARCHAR:
        // Schema::table('users', function (Blueprint $table) {
        //     $table->string('profile', 50)->nullable()->change();
        // });
    }

    public function down(): void
    {
        // Reverter para valores anteriores
        DB::statement("ALTER TABLE users MODIFY COLUMN profile ENUM('caregiver', 'accompanied') NULL");
    }
};
```

4. Execute a migration:
```bash
php artisan migrate
```

### Opção 3: Limpar Cache

Após fazer as alterações, limpe o cache:

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

## 🧪 Teste

Após aplicar a correção, teste criando uma conta:

```bash
curl -X POST http://192.168.0.20/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Profissional",
    "email": "teste.prof@test.com",
    "password": "123456",
    "password_confirmation": "123456",
    "profile": "professional_caregiver"
  }'
```

## 📋 Verificação

Para verificar se a coluna está correta:

```sql
SHOW COLUMNS FROM users WHERE Field = 'profile';
```

O resultado deve mostrar que aceita os valores: `caregiver`, `accompanied`, `professional_caregiver`

