# 🔧 Solução: Erro de Permissões e Migrations

## ❌ Problemas Encontrados

1. **Erro de permissão no log:** `Permission denied` em `storage/logs/laravel.log`
2. **Migration de documents falhou:** Tabela já existe, bloqueando outras migrations

## ✅ Solução Rápida

Execute no servidor:

```bash
ssh darley@193.203.182.22
cd /var/www/lacos-backend

# Opção 1: Usar script automatizado
sudo bash /tmp/fix_migrations.sh

# Opção 2: Manual (veja abaixo)
```

## 📝 Solução Manual

### 1. Corrigir permissões

```bash
sudo chown -R www-data:www-data storage/logs
sudo chmod -R 775 storage/logs
```

### 2. Marcar migration de documents como executada

```bash
# Verificar nome da migration
php artisan migrate:status | grep documents

# Marcar como executada (substitua NOME_DA_MIGRATION pelo nome real)
mysql -u root lacos -e "INSERT IGNORE INTO migrations (migration, batch) VALUES ('2025_11_30_010441_create_documents_table', (SELECT COALESCE(MAX(batch), 0) + 1 FROM (SELECT batch FROM migrations) AS m));"
```

### 3. Executar migrations de caregiver

```bash
php artisan migrate --force
```

### 4. Verificar

```bash
php artisan migrate:status | grep caregiver
```

Deve mostrar as 3 migrations de caregiver como executadas.

## ✅ Após executar

Teste a rota `/api/caregivers` no app. Deve funcionar!

