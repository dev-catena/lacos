# ✅ Solução: Executar Migrations de Cuidadores

## ❌ Erro

```
Table 'lacos.caregiver_reviews' doesn't exist
```

## 🚀 Solução Rápida

Execute no servidor:

```bash
ssh darley@192.168.0.20
cd /var/www/lacos-backend

# 1. Copiar migrations
TIMESTAMP1=$(date +%Y_%m_%d_%H%M%S)
TIMESTAMP2=$(date +%Y_%m_%d_%H%M%S)
TIMESTAMP3=$(date +%Y_%m_%d_%H%M%S)

sudo cp /tmp/add_caregiver_fields_to_users.php "database/migrations/${TIMESTAMP1}_add_caregiver_fields_to_users_table.php"
sudo cp /tmp/create_caregiver_courses_table.php "database/migrations/${TIMESTAMP2}_create_caregiver_courses_table.php"
sudo cp /tmp/create_caregiver_reviews_table.php "database/migrations/${TIMESTAMP3}_create_caregiver_reviews_table.php"

sudo chown www-data:www-data database/migrations/*caregiver*.php

# 2. Executar migrations
php artisan migrate --force

# 3. Verificar
php artisan migrate:status | grep caregiver
```

## ✅ Após executar

Teste a rota `/api/caregivers` no app novamente. Deve funcionar!

