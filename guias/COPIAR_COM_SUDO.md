# 🔧 Solução: Copiar Arquivos com Permissões

## Problema
O diretório `/var/www/lacos-backend/` requer permissões de root.

## Solução: Copiar para home e depois mover

### Passo 1: Copiar para o diretório home do usuário

Na sua máquina local, execute:

```bash
cd ~/lacos/backend-laravel

# Copiar para o home do usuário (não precisa de sudo)
scp create_plans_table.php darley@10.102.0.103:~/
scp create_user_plans_table.php darley@10.102.0.103:~/
scp Plan.php darley@10.102.0.103:~/
scp PlanController.php darley@10.102.0.103:~/
```

### Passo 2: No servidor, mover os arquivos com sudo

Conecte-se ao servidor e execute:

```bash
ssh darley@10.102.0.103
sudo mv ~/create_plans_table.php /var/www/lacos-backend/
sudo mv ~/create_user_plans_table.php /var/www/lacos-backend/
sudo mv ~/Plan.php /var/www/lacos-backend/app/Models/
sudo mv ~/PlanController.php /var/www/lacos-backend/app/Http/Controllers/Api/

# Ajustar permissões
sudo chown www-data:www-data /var/www/lacos-backend/create_plans_table.php
sudo chown www-data:www-data /var/www/lacos-backend/create_user_plans_table.php
sudo chown www-data:www-data /var/www/lacos-backend/app/Models/Plan.php
sudo chown www-data:www-data /var/www/lacos-backend/app/Http/Controllers/Api/PlanController.php
```

### Passo 3: Executar migrations

```bash
cd /var/www/lacos-backend
sudo php artisan migrate --path=create_plans_table.php
sudo php artisan migrate --path=create_user_plans_table.php
```

---

## Alternativa: Criar arquivos diretamente no servidor

Se preferir, você pode criar os arquivos diretamente no servidor usando `cat` ou `nano` com sudo.

