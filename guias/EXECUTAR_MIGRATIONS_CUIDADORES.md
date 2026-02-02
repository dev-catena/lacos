# 🚀 Executar Migrations de Cuidadores Profissionais

## ❌ Erro Atual

```
Table 'lacos.caregiver_reviews' doesn't exist
```

## ✅ Solução

### Opção 1: Script Automatizado

Execute no servidor:

```bash
ssh darley@10.102.0.103
cd /var/www/lacos-backend
sudo bash /tmp/executar_migrations_caregivers.sh
```

### Opção 2: Manual

**1. Copiar migrations:**

```bash
cd /var/www/lacos-backend

# Gerar timestamps
TIMESTAMP1=$(date +%Y_%m_%d_%H%M%S)
TIMESTAMP2=$(date +%Y_%m_%d_%H%M%S)
TIMESTAMP3=$(date +%Y_%m_%d_%H%M%S)

# Copiar migrations
sudo cp /tmp/add_caregiver_fields_to_users.php "database/migrations/${TIMESTAMP1}_add_caregiver_fields_to_users_table.php"
sudo cp /tmp/create_caregiver_courses_table.php "database/migrations/${TIMESTAMP2}_create_caregiver_courses_table.php"
sudo cp /tmp/create_caregiver_reviews_table.php "database/migrations/${TIMESTAMP3}_create_caregiver_reviews_table.php"

sudo chown www-data:www-data database/migrations/*caregiver*.php
```

**2. Executar migrations:**

```bash
php artisan migrate --force
```

**3. Verificar:**

```bash
php artisan migrate:status | grep caregiver
```

Deve mostrar as 3 migrations como executadas.

## ✅ Após executar

Teste a rota `/api/caregivers` novamente no app. Deve funcionar!

