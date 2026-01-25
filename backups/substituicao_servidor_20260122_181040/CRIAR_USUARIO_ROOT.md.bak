# 👤 Criar Usuário Root

## Opção 1: Criar via Tinker (Recomendado)

Execute no servidor:

```bash
cd /var/www/lacos-backend
php artisan tinker
```

Depois execute:

```php
$user = App\Models\User::create([
    'name' => 'Root Admin',
    'email' => 'root@lacos.com',
    'password' => Hash::make('sua_senha_aqui'),
    'profile' => 'caregiver',
    'is_blocked' => false,
]);

echo "Usuário root criado: " . $user->email;
exit
```

## Opção 2: Criar via Migration

Crie um arquivo `create_root_user.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')->insert([
            'name' => 'Root Admin',
            'email' => 'root@lacos.com',
            'password' => Hash::make('sua_senha_aqui'),
            'profile' => 'caregiver',
            'is_blocked' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('users')->where('email', 'root@lacos.com')->delete();
    }
};
```

Execute:
```bash
php artisan migrate --path=create_root_user.php
```

## Opção 3: Usar Usuário Existente

Se você já tem um usuário, pode usar suas credenciais para fazer login no sistema de gestão.

## 🔐 Credenciais Padrão (Altere!)

- **Email**: root@lacos.com
- **Senha**: (defina uma senha segura)

**IMPORTANTE**: Altere a senha padrão após o primeiro login!

