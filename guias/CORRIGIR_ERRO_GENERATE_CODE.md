# 🔧 CORREÇÃO: Erro generateUniqueCode()

## 🐛 Erro Identificado

```
Call to undefined method App\Models\Group::generateUniqueCode()
Linha: /var/www/lacos-backend/app/Http/Controllers/Api/GroupController.php:46
```

O controller está tentando chamar um método que **NÃO EXISTE** no Model.

---

## 🚀 CORREÇÃO RÁPIDA (Método 1: Script Automático)

**Execute no servidor**:

```bash
cd /var/www/lacos-backend

# Download do script
curl -o fix_generate_code.sh https://raw.githubusercontent.com/CelDarley/lacos/main/FIX_GENERATE_CODE.sh

# Dar permissão
chmod +x fix_generate_code.sh

# Executar
./fix_generate_code.sh
```

---

## 🛠️ CORREÇÃO MANUAL (Método 2: Se script não funcionar)

### Passo 1: Backup

```bash
cd /var/www/lacos-backend
cp app/Http/Controllers/Api/GroupController.php app/Http/Controllers/Api/GroupController.php.backup
```

### Passo 2: Ver Linha 46

```bash
sed -n '40,50p' app/Http/Controllers/Api/GroupController.php
```

Vai mostrar algo como:

```php
// Gerar código único
$code = Group::generateUniqueCode(); // ← LINHA COM ERRO
```

### Passo 3: Editar Arquivo

```bash
nano app/Http/Controllers/Api/GroupController.php
```

**Procure pela linha 46** (ou próximo):

```php
$code = Group::generateUniqueCode();
```

**Substitua por**:

```php
$code = strtoupper(substr(md5(uniqid(rand(), true)), 0, 8));
```

Salve: `Ctrl+O` → Enter → `Ctrl+X`

### Passo 4: Verificar Sintaxe

```bash
php -l app/Http/Controllers/Api/GroupController.php
```

Deve mostrar:
```
No syntax errors detected
```

### Passo 5: Limpar Cache

```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

### Passo 6: Reiniciar PHP-FPM

```bash
systemctl restart php8.2-fpm
# ou
systemctl restart php8.1-fpm
# ou  
systemctl restart php-fpm
```

---

## 🎯 CORREÇÃO ALTERNATIVA (Método 3: Adicionar o Método)

Se preferir adicionar o método ao Model:

### Editar Model Group

```bash
nano app/Models/Group.php
```

**Adicione este método dentro da classe** (antes da última chave `}`):

```php
/**
 * Gerar código único de 8 caracteres
 */
public static function generateUniqueCode()
{
    do {
        $code = strtoupper(substr(md5(uniqid(rand(), true)), 0, 8));
    } while (self::where('code', $code)->exists());
    
    return $code;
}
```

Salve: `Ctrl+O` → Enter → `Ctrl+X`

**Verificar sintaxe**:

```bash
php -l app/Models/Group.php
```

**Limpar cache e reiniciar**:

```bash
php artisan cache:clear
systemctl restart php8.2-fpm
```

---

## ✅ Como Testar

### Teste 1: Via curl

```bash
curl -X POST http://localhost/api/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "name": "Teste",
    "description": "Teste",
    "accompanied_name": "Rosa Mia",
    "accompanied_gender": "female"
  }'
```

**Resultado esperado**:
```json
{
  "id": 123,
  "name": "Teste",
  "code": "ABC12345",
  ...
}
```

### Teste 2: Via App

1. Abrir app
2. Criar grupo (Rosa Mia, Feminino, etc.)
3. **DEVE FUNCIONAR** ✅

---

## 📊 Resumo das Soluções

| Método | Dificuldade | Recomendado |
|--------|-------------|-------------|
| Script automático | ⭐ Fácil | ✅ Sim |
| Manual inline | ⭐⭐ Médio | ✅ Sim (se script falhar) |
| Adicionar método | ⭐⭐⭐ Difícil | 🔹 Melhor a longo prazo |

---

## 🔍 Verificar se Funcionou

Após a correção, ver o log:

```bash
tail -f /var/www/lacos-backend/storage/logs/laravel.log
```

E tentar criar grupo no app.

**Log esperado** (SEM ERRO):
```
[2025-11-24 ...] production.INFO: Grupo criado com sucesso
```

**Se der erro**, me envie o novo log!

---

## 🚨 Se Nada Funcionar

Execute este comando e me envie o resultado:

```bash
cat app/Http/Controllers/Api/GroupController.php | head -80
```

Vou ver o código completo e criar uma correção específica.

---

**🎯 EXECUTE A CORREÇÃO E TESTE NOVAMENTE!**

