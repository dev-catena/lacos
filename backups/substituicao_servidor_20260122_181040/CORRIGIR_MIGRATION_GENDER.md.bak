# 🔧 Corrigir Migration: Coluna Gender Já Existe

## ❌ Problema

```
Duplicate column name 'gender'
```

A coluna `gender` já existe na tabela `users`, então a migration está tentando adicioná-la novamente.

## ✅ Solução

### 1. Corrigir permissões do log

```bash
sudo chown -R www-data:www-data storage/logs
sudo chmod -R 775 storage/logs
```

### 2. Substituir a migration

```bash
cd /var/www/lacos-backend

# Substituir a migration que falhou
sudo cp /tmp/add_caregiver_fields_to_users_fixed.php database/migrations/2025_12_07_011103_add_caregiver_fields_to_users_table.php
sudo chown www-data:www-data database/migrations/2025_12_07_011103_add_caregiver_fields_to_users_table.php
```

### 3. Executar a migration corrigida

```bash
php artisan migrate --path=database/migrations/2025_12_07_011103_add_caregiver_fields_to_users_table.php --force
```

### 4. Verificar

```bash
php artisan migrate:status | grep caregiver
```

Todas as 3 migrations devem aparecer como executadas.

## ✅ Status Atual

- ✅ `create_caregiver_courses_table` - Executada
- ✅ `create_caregiver_reviews_table` - Executada  
- ⚠️ `add_caregiver_fields_to_users_table` - Falhou (será corrigida)

## 📝 O que a migration corrigida faz

A nova migration verifica se cada coluna já existe antes de tentar adicioná-la, evitando o erro de coluna duplicada.

