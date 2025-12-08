# 🔧 Corrigir Persistência de Sobrenome, CPF e Endereço

## ❌ Problema

Os campos **sobrenome**, **CPF** e **endereço** não estão sendo persistidos no banco de dados.

## ✅ Correções Aplicadas no Frontend

O frontend já foi corrigido para enviar:
- `last_name` - Sobrenome
- `cpf` - CPF (sem formatação, apenas números)
- `address` - Endereço
- `address_number` - Número do endereço
- `address_complement` - Complemento do endereço

## 🔍 Verificar Backend

### 1. Verificar se os campos estão no fillable do Model User

Execute no servidor:

```bash
ssh darley@193.203.182.22
cd /var/www/lacos-backend
grep -E 'last_name|cpf|address' app/Models/User.php
```

Se não aparecerem, adicione ao array `$fillable`:

```php
protected $fillable = [
    'name',
    'email',
    'password',
    'profile',
    'phone',
    'birth_date',
    'photo',
    'gender',
    'blood_type',
    'last_name',        // Adicionar
    'cpf',              // Adicionar
    'address',          // Adicionar
    'address_number',   // Adicionar
    'address_complement', // Adicionar
    'city',
    'state',
    'zip_code',
    // ... outros campos
];
```

### 2. Verificar UserController

Verifique se o método `update` está processando esses campos:

```bash
grep -A 30 "public function update" app/Http/Controllers/Api/UserController.php
```

O método deve aceitar e processar:
- `last_name`
- `cpf`
- `address`
- `address_number`
- `address_complement`

### 3. Verificar se as colunas existem no banco

Execute:

```bash
mysql -u root -p -e "DESCRIBE users;" nome_do_banco | grep -E 'last_name|cpf|address'
```

Se as colunas não existirem, será necessário criar uma migration.

## 🚀 Solução Rápida

Se os campos não estiverem no fillable, edite `app/Models/User.php`:

```bash
sudo nano app/Models/User.php
```

Adicione os campos ao array `$fillable` e salve.

Depois limpe o cache:

```bash
php artisan optimize:clear
```

## ✅ Após corrigir

Teste novamente salvando os dados pessoais. Os campos devem ser persistidos corretamente.

