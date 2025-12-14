# ✅ Solução Final: Executar Migrations

## ❌ Erro Atual

```
Table 'lacos.caregiver_reviews' doesn't exist
```

## 🚀 Solução em 2 Passos

### Passo 1: Atualizar Controller (já feito)

O controller foi atualizado para funcionar mesmo sem as tabelas, mas **você ainda precisa executar as migrations** para funcionalidade completa.

### Passo 2: Executar Migrations

Execute no servidor:

```bash
ssh darley@193.203.182.22
cd /var/www/lacos-backend

# Copiar migrations
TIMESTAMP1=$(date +%Y_%m_%d_%H%M%S)
TIMESTAMP2=$(date +%Y_%m_%d_%H%M%S)
TIMESTAMP3=$(date +%Y_%m_%d_%H%M%S)

sudo cp /tmp/add_caregiver_fields_to_users.php "database/migrations/${TIMESTAMP1}_add_caregiver_fields_to_users_table.php"
sudo cp /tmp/create_caregiver_courses_table.php "database/migrations/${TIMESTAMP2}_create_caregiver_courses_table.php"
sudo cp /tmp/create_caregiver_reviews_table.php "database/migrations/${TIMESTAMP3}_create_caregiver_reviews_table.php"

sudo chown www-data:www-data database/migrations/*caregiver*.php

# Executar migrations
php artisan migrate --force

# Verificar
php artisan migrate:status | grep caregiver
```

### Passo 3: Atualizar Controller

```bash
sudo cp /tmp/CaregiverController.php app/Http/Controllers/Api/CaregiverController.php
sudo chown www-data:www-data app/Http/Controllers/Api/CaregiverController.php
php artisan optimize:clear
```

## ✅ Após executar

Teste a rota `/api/caregivers` no app. Deve funcionar!

