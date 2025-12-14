# 🚨 DEBUG: ERRO 500 AO CRIAR GRUPO

## 📋 Status

**Payload Frontend**: ✅ CORRETO
```json
{
  "accessCode": null,
  "accompaniedAge": null,
  "accompaniedGender": "female", ← ✅ Convertido corretamente!
  "accompaniedName": "Rosa Mia",
  "description": "",
  "groupName": "Vovó ",
  "healthInfo": null
}
```

**Erro**: ❌ Server Error 500 (erro no backend)

---

## 🔍 DIAGNÓSTICO

### Passo 1: Ver Logs do Laravel

**Execute no servidor**:
```bash
tail -50 /var/www/lacos-backend/storage/logs/laravel.log
```

**Procure por**:
- `local.ERROR`
- `Stack trace`
- Mensagens de erro recentes

### Passo 2: Verificar Rota

**Execute no servidor**:
```bash
cd /var/www/lacos-backend
php artisan route:list | grep "POST.*groups"
```

**Deve mostrar**:
```
POST  api/groups .... GroupController@store
```

### Passo 3: Verificar Controller

**Execute no servidor**:
```bash
cat /var/www/lacos-backend/app/Http/Controllers/Api/GroupController.php | grep -A 30 "public function store"
```

---

## 🔧 POSSÍVEIS CAUSAS

### Causa 1: Campo `accompanied_age` NULL
```php
// Backend pode estar esperando idade calculada da data de nascimento
// Mas frontend está enviando NULL
```

**Solução**: Remover validação de `accompanied_age` ou torná-la opcional

### Causa 2: Campo `health_info` com Formato Errado
```php
// Backend pode estar tentando fazer JSON encode/decode
// Mas está recebendo NULL
```

**Solução**: Verificar tratamento de `health_info` no backend

### Causa 3: Relacionamento com Tabelas
```php
// Pode estar tentando criar relacionamento que não existe
// Exemplo: criar group_members mas user_id está errado
```

**Solução**: Verificar migrations e relacionamentos

### Causa 4: Campo Obrigatório Faltando
```php
// Backend pode ter validação que frontend não está enviando
```

**Solução**: Ver validação no `GroupController@store`

---

## 📝 COMANDOS PARA EXECUTAR NO SERVIDOR

### 1. Ver Log Completo
```bash
tail -100 /var/www/lacos-backend/storage/logs/laravel.log
```

### 2. Ver Apenas Erros Recentes
```bash
tail -100 /var/www/lacos-backend/storage/logs/laravel.log | grep -A 20 "local.ERROR"
```

### 3. Ver Controller
```bash
cat /var/www/lacos-backend/app/Http/Controllers/Api/GroupController.php
```

### 4. Ver Validação
```bash
grep -A 20 "validate" /var/www/lacos-backend/app/Http/Controllers/Api/GroupController.php | head -30
```

### 5. Testar Rota Manualmente
```bash
curl -X POST http://localhost/api/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "name": "Teste",
    "description": "Teste",
    "accompanied_name": "Rosa Mia",
    "accompanied_gender": "female"
  }'
```

---

## 🔍 O QUE PROCURAR NO LOG

### Exemplo de Erro Típico:

```
[2025-11-24 12:34:56] local.ERROR: SQLSTATE[23000]: 
Integrity constraint violation: 1048 Column 'user_id' cannot be null
```

### Ou:

```
[2025-11-24 12:34:56] local.ERROR: 
Call to undefined method App\Models\Group::members()
```

### Ou:

```
[2025-11-24 12:34:56] local.ERROR: 
Undefined array key "accompanied_age"
```

---

## 🚀 PRÓXIMOS PASSOS

1. **Execute os comandos acima no servidor**
2. **Me envie**:
   - Últimas 50 linhas do log
   - Mensagem de erro completa
   - Stack trace (se houver)

3. **Eu vou**:
   - Identificar o problema exato
   - Corrigir o backend
   - Testar novamente

---

## 💡 POSSÍVEL CORREÇÃO RÁPIDA

Se o problema for `accompanied_age` NULL, tente este fix:

```bash
# No servidor
cd /var/www/lacos-backend

# Editar GroupController.php
nano app/Http/Controllers/Api/GroupController.php
```

Procure por:
```php
$validated = $request->validate([
    'accompanied_age' => 'required|integer', // ← Problema aqui
]);
```

Mude para:
```php
$validated = $request->validate([
    'accompanied_age' => 'nullable|integer', // ← Adicionar nullable
]);
```

Salve (Ctrl+O, Enter, Ctrl+X) e teste novamente.

---

## 📊 CHECKLIST DE DEBUG

- [ ] Ver log do Laravel (últimas 50 linhas)
- [ ] Identificar mensagem de erro
- [ ] Ver stack trace
- [ ] Verificar qual campo está causando o erro
- [ ] Verificar validação no controller
- [ ] Verificar se todas as tabelas existem
- [ ] Verificar se migrations foram executadas
- [ ] Testar correção
- [ ] Confirmar que funciona

---

**🔍 EXECUTE OS COMANDOS E ME ENVIE O RESULTADO!**

Principalmente:
```bash
tail -50 /var/www/lacos-backend/storage/logs/laravel.log
```

Isso vai me mostrar exatamente o que está errado! 🎯

