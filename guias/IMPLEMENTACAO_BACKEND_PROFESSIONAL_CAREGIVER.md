# 🔧 Implementação Backend - Perfil "Cuidador Profissional"

## 📋 Resumo das Mudanças Necessárias

### ✅ O que já está funcionando:
1. **Modelo User** - O campo `profile` já está no `fillable` e não está no `hidden`, então será retornado automaticamente em todas as respostas JSON
2. **Login** - Já retorna o objeto `user` completo, incluindo o campo `profile`
3. **Endpoint /user** - Já retorna `$request->user()`, que inclui o campo `profile`
4. **Membros de Grupos** - O método `members()` já carrega o relacionamento `user` com `->with('user')`, então o `profile` já é retornado

### ⚠️ O que precisa ser modificado:
1. **Validação do Registro** - Adicionar `professional_caregiver` na validação do campo `profile`

---

## 🚀 Como Aplicar as Mudanças

### Opção 1: Executar o Script Automático (Recomendado)

1. Conecte-se ao servidor:
```bash
ssh darley@192.168.0.20
```

2. Execute o script com sudo:
```bash
sudo bash /tmp/update_backend_profile.sh
```

3. Verifique se a modificação foi aplicada:
```bash
grep "professional_caregiver" /var/www/lacos-backend/app/Http/Controllers/Api/AuthController.php
```

### Opção 2: Modificação Manual

1. Conecte-se ao servidor:
```bash
ssh darley@192.168.0.20
```

2. Faça backup do arquivo:
```bash
sudo cp /var/www/lacos-backend/app/Http/Controllers/Api/AuthController.php /var/www/lacos-backend/app/Http/Controllers/Api/AuthController.php.bak
```

3. Edite o arquivo:
```bash
sudo nano /var/www/lacos-backend/app/Http/Controllers/Api/AuthController.php
```

4. Localize a linha 20 e modifique:
```php
// ANTES:
'profile' => 'nullable|in:caregiver,accompanied',

// DEPOIS:
'profile' => 'nullable|in:caregiver,accompanied,professional_caregiver',
```

5. Salve o arquivo (Ctrl+O, Enter, Ctrl+X no nano)

---

## ✅ Verificação

Após aplicar as mudanças, verifique se está funcionando:

1. **Verificar a modificação no código:**
```bash
grep "professional_caregiver" /var/www/lacos-backend/app/Http/Controllers/Api/AuthController.php
```

2. **Testar o registro via API:**
```bash
curl -X POST http://192.168.0.20/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Profissional",
    "email": "teste.profissional@test.com",
    "password": "123456",
    "password_confirmation": "123456",
    "profile": "professional_caregiver"
  }'
```

3. **Verificar se o profile foi salvo:**
```bash
# Conecte-se ao servidor e execute:
php artisan tinker
# Depois no tinker:
$user = \App\Models\User::where('email', 'teste.profissional@test.com')->first();
echo $user->profile; // Deve retornar: professional_caregiver
```

---

## 📝 Arquivos Modificados

- ✅ `/var/www/lacos-backend/app/Http/Controllers/Api/AuthController.php` (linha 20)

## 📝 Arquivos que NÃO precisam ser modificados (já funcionam):

- ✅ `/var/www/lacos-backend/app/Models/User.php` - Já tem `profile` no fillable
- ✅ `/var/www/lacos-backend/app/Http/Controllers/Api/AuthController.php` (método `login`) - Já retorna `user` completo
- ✅ `/var/www/lacos-backend/routes/api.php` (endpoint `/user`) - Já retorna `$request->user()`
- ✅ `/var/www/lacos-backend/app/Http/Controllers/Api/GroupController.php` (método `members`) - Já carrega `user` com relacionamento

---

## 🎯 Resultado Final

Após aplicar essas mudanças:

1. ✅ Usuários podem se registrar com `profile: "professional_caregiver"`
2. ✅ O campo `profile` é retornado no login
3. ✅ O campo `profile` é retornado no endpoint `/user`
4. ✅ O campo `profile` é retornado quando listamos membros de grupos
5. ✅ O frontend pode exibir "Cuidador profissional" corretamente nos badges

---

## 🔍 Troubleshooting

Se algo não funcionar:

1. **Verificar permissões do arquivo:**
```bash
ls -la /var/www/lacos-backend/app/Http/Controllers/Api/AuthController.php
```

2. **Verificar se o Laravel está funcionando:**
```bash
php artisan route:list | grep register
```

3. **Verificar logs do Laravel:**
```bash
tail -f /var/www/lacos-backend/storage/logs/laravel.log
```

4. **Limpar cache do Laravel:**
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

