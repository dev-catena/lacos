# 📧 Verificação de Configuração de Email

## ⚠️ PROBLEMA IDENTIFICADO

O driver de email está configurado como **`log`**, o que significa que os emails **NÃO estão sendo enviados**, apenas logados no arquivo `storage/logs/laravel.log`.

## ✅ SOLUÇÃO

### 1. Verificar configuração atual:

```bash
cd /home/darley/lacos/backend-laravel
php artisan tinker --execute="echo json_encode(['mail_driver' => config('mail.default'), 'mail_host' => config('mail.mailers.smtp.host'), 'mail_port' => config('mail.mailers.smtp.port')], JSON_PRETTY_PRINT);"
```

### 2. Configurar SMTP no `.env`:

Edite o arquivo `.env` e adicione/atualize estas linhas:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=seu-email@gmail.com
MAIL_PASSWORD=sua-senha-app
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@lacos.com
MAIL_FROM_NAME="Laços"
```

**Para Gmail:**
- Use "Senhas de app" (não senha normal)
- Acesse: https://myaccount.google.com/apppasswords
- Gere uma senha de app e use no `MAIL_PASSWORD`

### 3. Limpar cache:

```bash
cd /home/darley/lacos/backend-laravel
php artisan config:clear
php artisan cache:clear
```

### 4. Testar envio de email:

```bash
php artisan tinker
```

```php
use Illuminate\Support\Facades\Mail;

Mail::raw('Teste de email do Laços', function($message) {
    $message->to('seu-email@teste.com')
            ->subject('Teste SMTP Laços');
});

echo "Email enviado! Verifique sua caixa de entrada.";
exit
```

## 🔍 COMO ESTÁ FUNCIONANDO AGORA

O código foi atualizado para:

1. **Sempre usar Mail do Laravel** (`Mail::send()`) - recurso nativo do Laravel
2. **Detectar quando o driver é "log"** e avisar nos logs
3. **Tentar fallback para `mail()` nativo** apenas se SMTP falhar (e não for driver 'log')

## 📝 LOGS

Verifique os logs para ver o que está acontecendo:

```bash
tail -f storage/logs/laravel.log | grep -i "email\|mail"
```

Você verá mensagens como:
- `✅ Email de registro recebido enviado via Laravel Mail para: ...`
- `⚠️ Driver "log" detectado - email não foi enviado, apenas logado`

## 🚀 PRÓXIMOS PASSOS

1. Configure SMTP no `.env` (veja passo 2 acima)
2. Limpe o cache (veja passo 3)
3. Teste o envio (veja passo 4)
4. Tente registrar um médico novamente e verifique se o email chega






