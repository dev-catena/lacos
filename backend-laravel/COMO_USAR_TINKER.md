# 🧪 Como Usar o Tinker

## ⚠️ Importante

O código PHP **NÃO** pode ser executado diretamente no bash. Você precisa entrar no **tinker** primeiro!

---

## ✅ Forma Correta

### 1. Entrar no Tinker

```bash
cd /var/www/lacos-backend
php artisan tinker
```

Você verá algo como:
```
Psy Shell v0.11.x (PHP 8.x — cli) by Justin Hileman
>>>
```

### 2. Executar Código PHP

Agora sim, dentro do tinker, você pode executar:

```php
use Illuminate\Support\Facades\Mail;

Mail::raw('Teste de email do Laços', function($message) {
    $message->to('coroneldarley@gmail.com')
            ->subject('Teste SMTP Laços');
});

echo "Email enviado!";
```

### 3. Sair do Tinker

```php
exit
```

Ou pressione `Ctrl + D`

---

## 🚀 Alternativa: Script Automático

Use o script que criei:

```bash
bash TESTAR_EMAIL.sh
```

Este script testa o envio de email automaticamente.

---

## 📝 Exemplos Úteis no Tinker

### Verificar Configurações

```php
config('mail.default')
config('mail.mailers.smtp.host')
config('database.default')
```

### Testar Conexão MySQL

```php
DB::connection()->getPdo();
echo "Conexão OK!";
```

### Ver Usuários

```php
use App\Models\User;
User::count();
User::where('profile', 'doctor')->get(['name', 'email']);
```

### Aprovar Médico Manualmente

```php
use App\Models\User;
$doctor = User::find(1); // ID do médico
$doctor->doctor_approved_at = now();
$doctor->save();
echo "Médico aprovado!";
```

---

## ❌ Erros Comuns

### "Command 'use' not found"

**Causa**: Tentou executar PHP diretamente no bash

**Solução**: Entre no tinker primeiro:
```bash
php artisan tinker
```

### "syntax error near unexpected token"

**Causa**: Bash tentando interpretar código PHP

**Solução**: Execute dentro do tinker, não no bash

---

## 💡 Dica

Se você quiser executar código PHP sem entrar no tinker interativo, use:

```bash
php artisan tinker --execute="código PHP aqui"
```

Exemplo:
```bash
php artisan tinker --execute="echo config('mail.default');"
```

---

**Última atualização**: 2025-12-14

