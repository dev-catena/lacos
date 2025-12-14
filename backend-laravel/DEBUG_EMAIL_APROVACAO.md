# 🐛 Debug - Email de Aprovação de Médico

## ✅ O que foi feito:

1. ✅ **Logs adicionados** no `AdminDoctorController`:
   - Log antes de tentar enviar
   - Log do driver de email
   - Log do template usado
   - Log de sucesso/erro detalhado

2. ✅ **Template verificado**: `resources/views/emails/doctor-activation.blade.php` existe

3. ✅ **Controller atualizado** no servidor

---

## 🧪 Como Testar:

### Opção 1: Script Automático

```bash
cd /var/www/lacos-backend
bash TESTAR_APROVACAO_MEDICO.sh
```

Este script:
- Verifica médicos pendentes
- Aprova um médico
- Mostra logs de email

### Opção 2: Manual (via Painel Web)

1. Acesse o painel web
2. Vá em "Gestão de Médicos"
3. Aprove um médico pendente
4. Verifique os logs:

```bash
tail -f storage/logs/laravel.log | grep -i "email\|mail\|activation"
```

---

## 📋 Verificar Logs:

### Ver todos os logs relacionados a email:

```bash
tail -100 storage/logs/laravel.log | grep -i "email\|mail\|activation\|doctor"
```

### Ver logs em tempo real:

```bash
tail -f storage/logs/laravel.log
```

### Filtrar apenas erros:

```bash
tail -100 storage/logs/laravel.log | grep -i "error\|exception" | grep -i "email\|mail"
```

---

## 🔍 O que procurar nos logs:

### ✅ Sucesso:
```
Tentando enviar email de ativação para: email@exemplo.com
Mail driver: smtp
Template path: emails.doctor-activation
Tentando enviar via Mail::send() para: email@exemplo.com
✅ Email de ativação enviado via SMTP para: email@exemplo.com
Email de ativação processado para: email@exemplo.com
```

### ❌ Erro:
```
Erro ao enviar email de ativação: [mensagem de erro]
Erro no Mail::send(): [detalhes do erro]
```

---

## ⚠️ Problemas Comuns:

### 1. Template não encontrado

**Erro**: `View [emails.doctor-activation] not found`

**Solução**:
```bash
# Verificar se template existe
ls -la resources/views/emails/doctor-activation.blade.php

# Se não existir, copiar do repositório
```

### 2. Erro de SMTP

**Erro**: `Connection could not be established`

**Solução**:
- Verificar credenciais no `.env`
- Testar SMTP manualmente: `php artisan tinker` → `Mail::raw(...)`

### 3. Email silenciosamente falha

**Causa**: Exceção sendo capturada mas não logada

**Solução**: Já adicionamos logs detalhados. Verifique `storage/logs/laravel.log`

---

## 🧪 Teste Manual no Tinker:

```bash
php artisan tinker
```

```php
use App\Models\User;
use App\Http\Controllers\Api\AdminDoctorController;

// Encontrar médico pendente
$doctor = User::where('profile', 'doctor')
    ->whereNull('doctor_approved_at')
    ->first();

if ($doctor) {
    $controller = new AdminDoctorController();
    $controller->approve($doctor->id);
    echo "Médico aprovado! Verifique logs.";
} else {
    echo "Nenhum médico pendente.";
}
```

---

## 📝 Próximos Passos:

1. ✅ Logs adicionados
2. ✅ Controller atualizado
3. ⏳ **Testar aprovação de médico**
4. ⏳ **Verificar logs**
5. ⏳ **Confirmar se email chegou**

---

**Última atualização**: 2025-12-14

