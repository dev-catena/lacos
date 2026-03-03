# ✅ SMTP Configurado com Sucesso!

## 📋 O que foi feito:

1. ✅ **Template de email criado**: `resources/views/emails/doctor-activation.blade.php`
2. ✅ **AdminDoctorController atualizado**: Agora usa Mail do Laravel (SMTP) com fallback para mail()
3. ✅ **Configurações SMTP adicionadas ao .env**: Pronto para configurar credenciais

---

## 🔧 Próximos Passos (IMPORTANTE):

### 1. Configurar Credenciais no .env

Edite o arquivo `.env` no servidor e configure:

```bash
ssh darley@192.168.0.20
cd /var/www/lacos-backend
nano .env  # ou vim .env
```

**Altere estas linhas:**

```env
MAIL_USERNAME=seu-email@gmail.com        # ← Seu email Gmail
MAIL_PASSWORD=sua-senha-app              # ← Senha de app (veja abaixo)
MAIL_FROM_ADDRESS=noreply@lacos.com      # ← Email remetente
```

### 2. Criar Senha de App do Gmail

⚠️ **NÃO use sua senha normal do Gmail!**

1. Acesse: https://myaccount.google.com/apppasswords
2. Selecione:
   - **App**: Mail
   - **Device**: Other (Custom name) → "Laravel Laços"
3. Clique em "Generate"
4. Copie a senha gerada (16 caracteres)
5. Cole no `MAIL_PASSWORD` do `.env`

### 3. Limpar Cache

```bash
cd /var/www/lacos-backend
php artisan config:clear
php artisan cache:clear
```

### 4. Testar Envio de Email

```bash
php artisan tinker
```

```php
use Illuminate\Support\Facades\Mail;

Mail::raw('Teste de email do Laços', function($message) {
    $message->to('seu-email@teste.com')
            ->subject('Teste SMTP Laços');
});

// Se não der erro, funcionou!
exit
```

---

## 🔄 Como Funciona Agora:

### Fluxo de Envio:

1. **Root aprova médico** → `AdminDoctorController::approve()`
2. **Sistema gera token** → Token de 64 caracteres
3. **Tenta enviar via SMTP** → Usa Mail do Laravel
4. **Se SMTP falhar** → Fallback para mail() nativo
5. **Log registrado** → `storage/logs/laravel.log`

### Código Atualizado:

```php
// Tenta SMTP primeiro
Mail::send('emails.doctor-activation', [
    'doctor' => $doctor,
    'activationUrl' => $activationUrl
], function ($message) use ($doctor) {
    $message->to($doctor->email, $doctor->name)
            ->subject('Ative sua conta de médico - Laços');
});

// Se falhar, usa mail() como fallback
```

---

## 📧 Outros Provedores de Email:

### Outlook/Hotmail:

```env
MAIL_HOST=smtp-mail.outlook.com
MAIL_PORT=587
MAIL_ENCRYPTION=tls
```

### SendGrid:

```env
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=SG.xxx  # API Key do SendGrid
MAIL_ENCRYPTION=tls
```

### Amazon SES:

```env
MAIL_MAILER=ses
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_DEFAULT_REGION=us-east-1
```

---

## 🧪 Verificar Logs:

```bash
# Ver logs de email
tail -f storage/logs/laravel.log | grep -i "email\|mail"

# Ver erros de SMTP
tail -f storage/logs/laravel.log | grep -i "smtp\|connection"
```

---

## ⚠️ Troubleshooting:

### Erro: "Connection refused"

**Causa**: Porta bloqueada ou credenciais incorretas

**Solução**:
- Verifique firewall: `sudo ufw status`
- Use porta 587 (TLS) ou 465 (SSL)
- Verifique credenciais no .env

### Erro: "Authentication failed"

**Causa**: Senha de app incorreta ou não configurada

**Solução**:
- Use senha de app, não senha normal
- Verifique se 2FA está ativado no Gmail
- Gere nova senha de app

### Emails não chegam

**Causa**: Vão para spam ou servidor bloqueado

**Solução**:
- Verifique pasta de spam
- Use serviço transacional (Mailgun, SendGrid)
- Configure SPF/DKIM no domínio

---

## ✅ Checklist:

- [x] Template de email criado
- [x] Controller atualizado
- [x] Configurações SMTP adicionadas ao .env
- [ ] **Configurar MAIL_USERNAME e MAIL_PASSWORD** ← FAZER AGORA
- [ ] Limpar cache
- [ ] Testar envio de email
- [ ] Aprovar um médico e verificar se email chega

---

**Última atualização**: 2025-12-14

