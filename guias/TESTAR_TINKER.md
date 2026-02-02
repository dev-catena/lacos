# 🧪 Testar Tinker e Funcionalidades

## ✅ Status Atual

- ✅ **Tinker funcionando**: `php artisan tinker` está operacional
- ✅ **Database configurado**: MySQL como padrão
- ⚠️ **Mail driver**: Verificar se está como `smtp` ou `log`

---

## 🧪 Comandos Úteis no Tinker

### 1. Verificar Configurações

```php
// Database
config('database.default')
config('database.connections.mysql.host')

// Mail
config('mail.default')
config('mail.mailers.smtp.host')
config('mail.from.address')
```

### 2. Testar Conexão com MySQL

```php
try {
    DB::connection()->getPdo();
    echo "✅ Conexão MySQL OK";
} catch (Exception $e) {
    echo "❌ Erro: " . $e->getMessage();
}
```

### 3. Testar Envio de Email

```php
use Illuminate\Support\Facades\Mail;

Mail::raw('Teste de email do Laços', function($message) {
    $message->to('seu-email@teste.com')
            ->subject('Teste SMTP Laços');
});

echo "✅ Email enviado (ou logado se driver=log)";
```

### 4. Verificar Usuários

```php
use App\Models\User;

// Contar usuários
User::count();

// Listar médicos
User::where('profile', 'doctor')->get(['id', 'name', 'email', 'doctor_approved_at']);

// Verificar médico pendente
$doctor = User::where('profile', 'doctor')->whereNull('doctor_approved_at')->first();
if ($doctor) {
    echo "Médico pendente: " . $doctor->name . " (" . $doctor->email . ")";
}
```

### 5. Testar Aprovação de Médico

```php
use App\Models\User;
use App\Http\Controllers\Api\AdminDoctorController;

$doctor = User::where('profile', 'doctor')->whereNull('doctor_approved_at')->first();
if ($doctor) {
    $controller = new AdminDoctorController();
    $reflection = new ReflectionClass($controller);
    $method = $reflection->getMethod('approve');
    $method->setAccessible(true);
    // Não recomendado - melhor usar a rota API
}
```

---

## 🔍 Verificar Logs

```bash
# Ver logs do Laravel
tail -f storage/logs/laravel.log

# Filtrar por email
tail -f storage/logs/laravel.log | grep -i "email\|mail"

# Filtrar por erro
tail -f storage/logs/laravel.log | grep -i "error\|exception"
```

---

## ⚠️ Troubleshooting

### Mail driver está como "log"

**Causa**: Cache de configuração ou `.env` não está sendo lido

**Solução**:
```bash
php artisan config:clear
php artisan cache:clear
# Verificar .env
grep MAIL_MAILER .env
```

### Erro de conexão MySQL

**Causa**: Credenciais incorretas ou usuário sem permissão

**Solução**:
```bash
# Verificar credenciais
grep DB_ .env

# Testar conexão direta
mysql -u lacos -pLacos2025Secure lacos -e "SELECT 1;"
```

---

## 📝 Exemplos Práticos

### Aprovar um médico manualmente

```php
use App\Models\User;

$doctor = User::find(1); // ID do médico
$doctor->doctor_approved_at = now();
$doctor->save();
echo "Médico aprovado: " . $doctor->name;
```

### Enviar email de teste

```php
use Illuminate\Support\Facades\Mail;

Mail::send('emails.doctor-activation', [
    'doctor' => (object)['name' => 'Teste'],
    'activationUrl' => 'http://teste.com'
], function($message) {
    $message->to('seu-email@teste.com')
            ->subject('Teste');
});
```

---

**Última atualização**: 2025-12-14

