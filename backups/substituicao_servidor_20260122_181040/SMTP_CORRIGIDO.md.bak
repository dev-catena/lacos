# ✅ SMTP Corrigido - Configuração Final

## 🔧 O que foi corrigido:

1. ✅ **config/mail.php** - Valores padrão atualizados:
   - `'host' => env('MAIL_HOST', 'smtp.gmail.com')` (antes: '127.0.0.1')
   - `'port' => env('MAIL_PORT', 587)` (antes: 2525)

2. ✅ **Cache limpo** - Todas as configurações em cache foram removidas

3. ✅ **Verificação** - Host e Port agora estão corretos:
   - Host: smtp.gmail.com
   - Port: 587

---

## 🧪 Teste Agora:

### No Tinker:

```bash
php artisan tinker
```

```php
use Illuminate\Support\Facades\Mail;

Mail::raw('Teste de email do Laços', function($message) {
    $message->to('coroneldarley@gmail.com')
            ->subject('Teste SMTP Laços');
});

echo "Email enviado!";
```

### Resultado Esperado:

- ✅ **Sucesso**: "Email enviado!" sem erros
- ❌ **Erro de autenticação**: Verifique `MAIL_PASSWORD` no `.env`
- ❌ **Erro de conexão**: Verifique firewall/porta 587

---

## 📋 Configuração Atual:

### .env:
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=gestor@catenasystem.com.br
MAIL_PASSWORD="zhrw pwcj qqra kvtb"
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@lacos.com
MAIL_FROM_NAME="Laços"
```

### config/mail.php:
```php
'host' => env('MAIL_HOST', 'smtp.gmail.com'),
'port' => env('MAIL_PORT', 587),
```

---

## ⚠️ Se ainda der erro:

### Erro: "Authentication failed"

**Causa**: Senha de app do Gmail incorreta ou não configurada

**Solução**:
1. Acesse: https://myaccount.google.com/apppasswords
2. Gere nova senha de app
3. Atualize `MAIL_PASSWORD` no `.env`
4. Limpe cache: `php artisan config:clear`

### Erro: "Connection refused"

**Causa**: Porta bloqueada ou servidor SMTP inacessível

**Solução**:
```bash
# Testar conectividade
telnet smtp.gmail.com 587

# Ou
nc -zv smtp.gmail.com 587
```

### Erro: "Connection timeout"

**Causa**: Firewall bloqueando porta 587

**Solução**:
```bash
# Verificar firewall
sudo ufw status

# Permitir porta 587 (se necessário)
sudo ufw allow 587/tcp
```

---

## 📝 Verificar Logs:

```bash
# Ver logs de email
tail -f storage/logs/laravel.log | grep -i "mail\|email\|smtp"

# Ver erros
tail -f storage/logs/laravel.log | grep -i "error\|exception"
```

---

## ✅ Checklist Final:

- [x] config/mail.php corrigido
- [x] Cache limpo
- [x] Host: smtp.gmail.com
- [x] Port: 587
- [ ] **Testar envio de email** ← FAZER AGORA
- [ ] Verificar se email chegou
- [ ] Testar aprovação de médico (envio automático)

---

**Última atualização**: 2025-12-14

