# 🔧 CORREÇÃO DO ERRO: created_by doesn't have a default value

## ❌ **Erro Identificado**

```
PDOException: SQLSTATE[HY000]: General error: 1364 
Field 'created_by' doesn't have a default value
```

**Localização**: Linha 43 do `GroupController.php`

**Causa**: 
- A coluna `created_by` na tabela `groups` **NÃO aceita NULL**
- O `GroupController` **NÃO estava enviando** esse campo ao criar grupo
- O MySQL **rejeita** a inserção sem valor

---

## ✅ **SOLUÇÃO APLICADA**

### 1️⃣ **Banco de Dados**
```sql
-- Tornar created_by nullable
ALTER TABLE `groups` MODIFY COLUMN created_by BIGINT UNSIGNED NULL;
```

### 2️⃣ **GroupController.php**
Adicionar linha no método `store()`:
```php
'created_by' => $request->user()->id,
```

---

## 🚀 **EXECUTAR NO SERVIDOR**

### **Método Automático (Recomendado)**

```bash
cd /var/www/lacos-backend
bash fix_accompanied_name_v2.sh
```

**O script fará automaticamente**:
1. ✅ Backup do banco de dados
2. ✅ Modificar coluna `created_by` para NULL
3. ✅ Backup do `GroupController.php`
4. ✅ Adicionar `'created_by' => $request->user()->id`
5. ✅ Verificar sintaxe PHP
6. ✅ Limpar todos os caches
7. ✅ Reiniciar PHP-FPM

---

### **Método Manual (se preferir)**

#### **Passo 1: Backup**
```bash
cd /var/www/lacos-backend
mysqldump -u root -p lacos > backup_$(date +%Y%m%d).sql
cp app/Http/Controllers/Api/GroupController.php app/Http/Controllers/Api/GroupController.php.backup
```

#### **Passo 2: Modificar Banco**
```bash
mysql lacos << 'SQL'
ALTER TABLE `groups` MODIFY COLUMN created_by BIGINT UNSIGNED NULL;
DESCRIBE `groups`;
SQL
```

#### **Passo 3: Modificar Controller**
Editar `/var/www/lacos-backend/app/Http/Controllers/Api/GroupController.php`

Procurar (aprox. linha 38-45):
```php
$group = Group::create([
    'name' => $validated['name'],
    'description' => $validated['description'],
    'code' => strtoupper(substr(md5(uniqid(rand(), true)), 0, 8)),
    'accompanied_name' => $validated['accompanied_name'] ?? 'Não informado',
    'accompanied_age' => $validated['accompanied_age'],
    'accompanied_gender' => $validated['accompanied_gender'],
    'accompanied_photo' => $accompaniedPhotoPath,
]);
```

**ADICIONAR** esta linha antes do último `]);`:
```php
    'created_by' => $request->user()->id,
```

Resultado:
```php
$group = Group::create([
    'name' => $validated['name'],
    'description' => $validated['description'],
    'code' => strtoupper(substr(md5(uniqid(rand(), true)), 0, 8)),
    'accompanied_name' => $validated['accompanied_name'] ?? 'Não informado',
    'accompanied_age' => $validated['accompanied_age'],
    'accompanied_gender' => $validated['accompanied_gender'],
    'accompanied_photo' => $accompaniedPhotoPath,
    'created_by' => $request->user()->id,
]);
```

#### **Passo 4: Verificar Sintaxe**
```bash
php -l app/Http/Controllers/Api/GroupController.php
```

Deve retornar: `No syntax errors detected`

#### **Passo 5: Limpar Caches**
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
php -r "opcache_reset();"
systemctl restart php8.2-fpm
```

---

## 🧪 **TESTAR**

1. Reiniciar o app no dispositivo
2. Criar uma nova conta
3. Criar um novo grupo
4. **Deve funcionar sem erro 500!** ✅

---

## 🔍 **VERIFICAR SE DEU CERTO**

```bash
# Ver estrutura da coluna
mysql lacos -e "DESCRIBE \`groups\`;" | grep created_by

# Ver logs
tail -20 /var/www/lacos-backend/storage/logs/laravel.log

# Ver último grupo criado
mysql lacos -e "SELECT id, name, created_by, created_at FROM \`groups\` ORDER BY id DESC LIMIT 5;"
```

---

## 📊 **POR QUE ISSO ACONTECEU?**

1. A migration inicial criou `created_by` como **NOT NULL**
2. Em algum momento, o código do `GroupController` foi modificado e **removeu** o campo `created_by`
3. O MySQL não conseguia inserir sem valor

**Solução**: Tornar nullable + garantir que sempre seja enviado.

---

## 🆘 **SE DER ERRO**

### Restaurar backup do banco:
```bash
mysql lacos < backup_NOME_DO_ARQUIVO.sql
```

### Restaurar backup do controller:
```bash
cp app/Http/Controllers/Api/GroupController.php.backup app/Http/Controllers/Api/GroupController.php
systemctl restart php8.2-fpm
```

---

**Criado em**: 24/11/2025  
**Erro**: `Field 'created_by' doesn't have a default value`  
**Status**: ✅ Solucionado

