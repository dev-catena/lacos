# 🔧 Verificar e Corrigir Credenciais do Banco de Dados

## ❌ Erro

```
SQLSTATE[HY000] [1045] Access denied for user 'lacos'@'localhost' (using password: YES)
```

Este erro indica que as credenciais do banco de dados no arquivo `.env` estão incorretas.

## ✅ Solução

### Opção 1: Script Automático

Execute o script que corrige permissões e verifica credenciais:

```bash
bash CORRIGIR_LOG_E_BANCO.sh
```

### Opção 2: Correção Manual

#### 1. Editar arquivo .env

```bash
cd /var/www/lacos-backend  # ou caminho do seu projeto
nano .env
```

#### 2. Verificar/Corrigir estas linhas:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nome_do_seu_banco
DB_USERNAME=usuario_do_banco
DB_PASSWORD=senha_do_banco
```

**Importante:**
- `DB_HOST` geralmente é `127.0.0.1` ou `localhost`
- `DB_PORT` geralmente é `3306` para MySQL
- `DB_DATABASE` é o nome do banco de dados
- `DB_USERNAME` é o usuário do MySQL
- `DB_PASSWORD` é a senha do usuário

#### 3. Verificar se o banco de dados existe

Conecte ao MySQL:

```bash
sudo mysql -u root -p
```

No MySQL, verifique:

```sql
-- Listar bancos de dados
SHOW DATABASES;

-- Verificar se o banco existe
-- Se não existir, criar:
CREATE DATABASE nome_do_banco CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Verificar usuários
SELECT user, host FROM mysql.user;

-- Se o usuário não existir, criar:
CREATE USER 'usuario'@'localhost' IDENTIFIED BY 'senha';
GRANT ALL PRIVILEGES ON nome_do_banco.* TO 'usuario'@'localhost';
FLUSH PRIVILEGES;

-- Sair
EXIT;
```

#### 4. Testar conexão

```bash
# Testar via mysql client
mysql -h 127.0.0.1 -u usuario -p nome_do_banco

# Ou testar via Laravel
php artisan tinker
```

No tinker:

```php
DB::connection()->getPdo();
// Se não der erro, a conexão está OK
exit
```

#### 5. Limpar cache

```bash
php artisan config:clear
php artisan cache:clear
```

## 🔍 Verificar Credenciais Atuais

Para ver as credenciais atuais (sem mostrar senha):

```bash
cd /var/www/lacos-backend
grep "^DB_" .env
```

## 🆘 Se Ainda Não Funcionar

### Verificar se MySQL está rodando:

```bash
sudo systemctl status mysql
# ou
sudo systemctl status mariadb
```

### Verificar logs do MySQL:

```bash
sudo tail -f /var/log/mysql/error.log
```

### Recriar usuário do banco:

```bash
sudo mysql -u root -p
```

```sql
-- Remover usuário antigo (se existir)
DROP USER IF EXISTS 'lacos'@'localhost';

-- Criar novo usuário
CREATE USER 'lacos'@'localhost' IDENTIFIED BY 'nova_senha_aqui';
GRANT ALL PRIVILEGES ON lacos.* TO 'lacos'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Depois atualize o `.env` com a nova senha.

## 📝 Notas Importantes

- **Nunca** commite o arquivo `.env` no Git
- Sempre faça backup antes de alterar credenciais
- Use senhas fortes para produção
- O usuário do banco precisa ter permissões no banco de dados especificado

