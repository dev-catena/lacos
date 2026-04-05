# 🔧 Instruções para Executar Migrations no Servidor

## Problemas Identificados

1. **Permissões do storage/logs**: O Laravel não consegue escrever no arquivo de log
2. **Configuração do banco**: Pode estar usando SQLite sem o driver instalado

## Solução Rápida

### 1. Localizar o diretório do backend

No servidor, execute:

```bash
# Procurar o diretório do backend
find /var/www /home -name "artisan" -type f 2>/dev/null | head -1
```

Ou verifique se está em:
- `/var/www/lacos-backend`
- `/home/darley/lacos-backend`
- `/home/darley/lacos/backend-laravel`

### 2. Corrigir permissões

```bash
# Navegar para o diretório do backend
cd /caminho/para/backend

# Corrigir permissões do storage
sudo chmod -R 775 storage bootstrap/cache
sudo chown -R www-data:www-data storage bootstrap/cache

# Criar arquivo de log se não existir
sudo touch storage/logs/laravel.log
sudo chmod 664 storage/logs/laravel.log
sudo chown www-data:www-data storage/logs/laravel.log
```

### 3. Verificar/Configurar banco de dados MySQL

```bash
# Verificar configuração atual
grep "^DB_" .env | grep -E "(CONNECTION|DATABASE|USERNAME|PASSWORD)"

# Configurar .env para MySQL (se necessário)
# Credenciais:
# DB_CONNECTION=mysql
# DB_DATABASE=lacos
# DB_USERNAME=lacos
# DB_PASSWORD=Lacos2025Secure
```

**Verificar se o banco existe:**
```bash
mysql -u lacos -p'Lacos2025Secure' -e "SHOW DATABASES;" | grep lacos
```

**Se o banco não existir, criar (usando usuário lacos):**
```bash
# Tentar criar com usuário lacos (se tiver permissão)
mysql -u lacos -p'Lacos2025Secure' -e "CREATE DATABASE IF NOT EXISTS lacos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || {
    echo "⚠️  Usuário lacos não tem permissão para criar banco."
    echo "   Se necessário, use root temporariamente ou peça ao DBA para criar o banco."
}
```

### 4. Executar migrations

```bash
# Executar migrations (--force para produção)
php artisan migrate --force
```

## Script Automatizado

Use o script `EXECUTAR_MIGRATIONS_SERVIDOR.sh`:

```bash
cd /caminho/para/backend-laravel
./EXECUTAR_MIGRATIONS_SERVIDOR.sh
```

## Se ainda houver problemas

### Erro: "could not find driver"

Verifique se o driver MySQL está habilitado:
```bash
php -m | grep mysql
```

Se não aparecer, verifique se o PHP está configurado corretamente (mas não instale nada novo).

### Erro: "Permission denied" no storage

```bash
sudo chmod -R 775 storage bootstrap/cache
sudo chown -R www-data:www-data storage bootstrap/cache
```

### Erro: "Database does not exist"

Verifique se o banco existe usando o usuário lacos:

```bash
# Verificar se o banco existe
mysql -u lacos -p'Lacos2025Secure' -e "SHOW DATABASES;" | grep lacos

# Se não existir, tentar criar (se o usuário tiver permissão)
mysql -u lacos -p'Lacos2025Secure' -e "CREATE DATABASE IF NOT EXISTS lacos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

## Verificar se funcionou

```bash
# Verificar tabelas criadas
php artisan migrate:status

# Ou no MySQL:
mysql -u lacos -p'Lacos2025Secure' lacos -e "SHOW TABLES;"
```

