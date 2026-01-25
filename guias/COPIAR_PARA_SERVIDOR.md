# 📋 Como Copiar Arquivos para o Servidor

## Opção 1: Usar SCP (Recomendado)

Execute estes comandos na sua máquina local (não no servidor):

```bash
# Navegar até a pasta do projeto
cd ~/lacos/backend-laravel

# Copiar arquivos para o servidor
scp create_plans_table.php darley@10.102.0.103:/var/www/lacos-backend/
scp create_user_plans_table.php darley@10.102.0.103:/var/www/lacos-backend/
scp Plan.php darley@10.102.0.103:/var/www/lacos-backend/
scp PlanController.php darley@10.102.0.103:/var/www/lacos-backend/app/Http/Controllers/Api/
```

## Opção 2: Criar Diretamente no Servidor

Conecte-se ao servidor e crie os arquivos manualmente:

```bash
ssh darley@10.102.0.103
sudo su
cd /var/www/lacos-backend
```

Depois, crie os arquivos usando `nano` ou `vim`.

## Opção 3: Usar Git (Se o projeto estiver versionado)

```bash
# No servidor
cd /var/www/lacos-backend
git pull
```

## 📝 Arquivos que Precisam ser Copiados

1. `create_plans_table.php` → `/var/www/lacos-backend/`
2. `create_user_plans_table.php` → `/var/www/lacos-backend/`
3. `Plan.php` → `/var/www/lacos-backend/app/Models/` (ou raiz se não usar Models)
4. `PlanController.php` → `/var/www/lacos-backend/app/Http/Controllers/Api/`

## ⚠️ Importante

Depois de copiar, você também precisa:
1. Atualizar o arquivo de rotas (`routes/api.php` ou similar)
2. Executar as migrations

