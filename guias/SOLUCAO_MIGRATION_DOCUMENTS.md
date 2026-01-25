# Solução para Erro de Migration - Tabela documents já existe

## Problema

A migration `2025_11_30_010441_create_documents_table` está tentando criar a tabela `documents`, mas ela já existe no banco de dados.

## Soluções

### Opção 1: Marcar migration como executada (Recomendado)

Execute no servidor:

```bash
ssh darley@10.102.0.103
cd /var/www/lacos-backend

# Marcar migration como executada
php artisan tinker
```

No tinker, execute:

```php
DB::table('migrations')->insert([
    'migration' => '2025_11_30_010441_create_documents_table',
    'batch' => DB::table('migrations')->max('batch') + 1
]);
```

Ou execute diretamente:

```bash
php artisan tinker --execute="
    if (!DB::table('migrations')->where('migration', '2025_11_30_010441_create_documents_table')->exists()) {
        DB::table('migrations')->insert([
            'migration' => '2025_11_30_010441_create_documents_table',
            'batch' => DB::table('migrations')->max('batch') + 1
        ]);
        echo 'Migration marcada como executada';
    } else {
        echo 'Migration já está marcada';
    }
"
```

### Opção 2: Executar apenas a migration de doctor_availability

```bash
ssh darley@10.102.0.103
cd /var/www/lacos-backend

# Encontrar a migration de doctor_availability
MIGRATION_FILE=$(ls -t database/migrations/*create_doctor_availability_tables.php | head -1)

# Executar apenas esta migration
php artisan migrate --path=database/migrations/$(basename $MIGRATION_FILE)
```

### Opção 3: Pular migration problemática

```bash
ssh darley@10.102.0.103
cd /var/www/lacos-backend

# Executar migrations pulando a problemática
php artisan migrate --force --pretend
# Se estiver tudo certo, execute sem --pretend
php artisan migrate --force
```

## Após resolver

Execute a migration de doctor_availability:

```bash
php artisan migrate --path=database/migrations/*create_doctor_availability_tables.php
```

Ou execute todas as migrations pendentes:

```bash
php artisan migrate
```

## Verificar status

```bash
php artisan migrate:status
```

Isso mostrará quais migrations foram executadas e quais estão pendentes.


