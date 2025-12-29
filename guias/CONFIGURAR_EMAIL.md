# 📧 Configuração de Email no Backend

## 📋 Situação Atual

O backend está usando a função **`mail()` nativa do PHP** para enviar emails. Isso funciona, mas tem limitações:

### ✅ Vantagens:
- Não requer configuração adicional
- Funciona imediatamente (se o servidor tiver sendmail/postfix configurado)
- Simples de implementar

### ⚠️ Limitações:
- Pode não funcionar em todos os servidores
- Emails podem ir para spam
- Sem controle de fila/retry
- Sem logs detalhados
- Não funciona bem em produção

---

## 🔍 Como Está Implementado Atualmente

### Localização do Código:
**Arquivo**: `app/Http/Controllers/Api/AdminDoctorController.php`

**Método**: `sendActivationEmail()`

```php
private function sendActivationEmail($doctor, $token)
{
    // ... prepara HTML do email ...
    
    // Usa mail() nativo do PHP
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: Laços <noreply@lacos.com>" . "\r\n";
    $headers .= "Reply-To: noreply@lacos.com" . "\r\n";
    
    $sent = mail($doctor->email, $subject, $message, $headers);
    
    if (!$sent) {
        \Log::warning('Falha ao enviar email de ativação para: ' . $doctor->email);
    } else {
        \Log::info('Email de ativação enviado para: ' . $doctor->email);
    }
}
```

---

## 🚀 Como Melhorar (Recomendado para Produção)

### Opção 1: SMTP (Gmail, Outlook, etc.)

#### 1. Configurar `.env`:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=seu-email@gmail.com
MAIL_PASSWORD=sua-senha-app  # Use senha de app, não senha normal
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@lacos.com
MAIL_FROM_NAME="${APP_NAME}"
```

**Para Gmail:**
1. Ative "Senhas de app" em: https://myaccount.google.com/apppasswords
2. Use a senha de app gerada (não sua senha normal)

**Para Outlook/Hotmail:**
```env
MAIL_HOST=smtp-mail.outlook.com
MAIL_PORT=587
MAIL_ENCRYPTION=tls
```

#### 2. Modificar `AdminDoctorController.php`:

```php
use Illuminate\Support\Facades\Mail;

private function sendActivationEmail($doctor, $token)
{
    $activationUrl = config('app.url') . '/api/doctors/activate?token=' . $token;
    
    try {
        Mail::send('emails.doctor-activation', [
            'doctor' => $doctor,
            'activationUrl' => $activationUrl
        ], function ($message) use ($doctor) {
            $message->to($doctor->email)
                    ->subject('Ative sua conta de médico - Laços');
        });
        
        \Log::info('Email de ativação enviado para: ' . $doctor->email);
    } catch (\Exception $e) {
        \Log::error('Erro ao enviar email: ' . $e->getMessage());
    }
}
```

#### 3. Criar template de email:

**Arquivo**: `resources/views/emails/doctor-activation.blade.php`

```blade
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Laços - Ativação de Conta</h1>
        </div>
        <div class="content">
            <p>Olá <strong>{{ $doctor->name }}</strong>,</p>
            <p>Sua conta de médico foi aprovada pela equipe Laços!</p>
            <p>Para ativar sua conta e começar a usar a plataforma, clique no botão abaixo:</p>
            <p style="text-align: center;">
                <a href="{{ $activationUrl }}" class="button">Ativar Minha Conta</a>
            </p>
            <p>Ou copie e cole o link abaixo no seu navegador:</p>
            <p style="word-break: break-all; color: #666;">{{ $activationUrl }}</p>
            <p><strong>Este link expira em 7 dias.</strong></p>
            <p>Se você não solicitou esta conta, pode ignorar este email.</p>
        </div>
        <div class="footer">
            <p>Laços - Plataforma de Cuidados</p>
            <p>Este é um email automático, por favor não responda.</p>
        </div>
    </div>
</body>
</html>
```

---

### Opção 2: Serviços de Email Transacionais

#### Mailgun (Recomendado)

1. **Criar conta em**: https://www.mailgun.com
2. **Configurar `.env`**:
```env
MAIL_MAILER=mailgun
MAILGUN_DOMAIN=seu-dominio.com
MAILGUN_SECRET=key-xxx
MAILGUN_ENDPOINT=api.mailgun.net
```

3. **Instalar pacote**:
```bash
composer require symfony/mailgun-mailer symfony/http-client
```

#### SendGrid

1. **Criar conta em**: https://sendgrid.com
2. **Configurar `.env`**:
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=SG.xxx  # API Key do SendGrid
MAIL_ENCRYPTION=tls
```

#### Amazon SES

1. **Configurar `.env`**:
```env
MAIL_MAILER=ses
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_DEFAULT_REGION=us-east-1
```

2. **Instalar pacote**:
```bash
composer require aws/aws-sdk-php
```

---

## 🧪 Testar Configuração de Email

### Teste 1: Verificar se mail() funciona

```bash
php -r "mail('seu-email@teste.com', 'Teste', 'Mensagem de teste');"
```

### Teste 2: Testar via Laravel Tinker

```bash
cd /var/www/lacos-backend
php artisan tinker
```

```php
Mail::raw('Teste de email', function ($message) {
    $message->to('seu-email@teste.com')
            ->subject('Teste');
});
```

### Teste 3: Verificar logs

```bash
tail -f storage/logs/laravel.log | grep -i mail
```

---

## 📝 Script para Migrar para SMTP

Crie o arquivo `MIGRAR_EMAIL_SMTP.sh`:

```bash
#!/bin/bash

cd /var/www/lacos-backend

echo "📧 Configurando email SMTP..."
echo ""

# Backup do .env
cp .env .env.backup.$(date +%s)

# Adicionar configurações SMTP (Gmail como exemplo)
cat >> .env << EOF

# Configuração de Email SMTP
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=seu-email@gmail.com
MAIL_PASSWORD=sua-senha-app
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@lacos.com
MAIL_FROM_NAME="Laços"
EOF

echo "✅ Configurações adicionadas ao .env"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   1. Edite o .env e configure MAIL_USERNAME e MAIL_PASSWORD"
echo "   2. Para Gmail, use 'Senhas de app' (não senha normal)"
echo "   3. Teste com: php artisan tinker"
echo ""
```

---

## 🔍 Verificar Status Atual

Para verificar como o email está configurado no servidor:

```bash
ssh darley@193.203.182.22
cd /var/www/lacos-backend

# Ver configurações de email
grep MAIL_ .env

# Verificar se sendmail está instalado
which sendmail
sendmail -v

# Ver logs de email
tail -f storage/logs/laravel.log | grep -i "email\|mail"
```

---

## ⚠️ Problemas Comuns

### 1. Emails não chegam

**Causa**: Servidor não tem sendmail/postfix configurado

**Solução**: Configure SMTP ou instale sendmail:
```bash
sudo apt-get install sendmail
sudo sendmailconfig
```

### 2. Emails vão para spam

**Causa**: Usando mail() sem autenticação

**Solução**: Use SMTP autenticado ou serviço transacional

### 3. Erro "Connection refused"

**Causa**: Porta SMTP bloqueada ou credenciais incorretas

**Solução**: 
- Verifique firewall
- Use porta 587 (TLS) ou 465 (SSL)
- Verifique credenciais

---

## 📚 Referências

- [Laravel Mail Documentation](https://laravel.com/docs/mail)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Mailgun Documentation](https://documentation.mailgun.com/)
- [SendGrid Documentation](https://docs.sendgrid.com/)

---

**Última atualização**: 2025-12-14

