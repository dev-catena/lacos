# Configurar App para Backend Local

Este guia explica como configurar o app React Native para usar o backend Laravel local.

## ✅ Status Atual

- ✅ Backend local atualizado
- ✅ App configurado para `http://localhost:8000/api`
- ✅ Backup da configuração anterior criado

## 🚀 Iniciar Backend Local

### 1. Verificar Pré-requisitos

```bash
# Verificar PHP
php -v  # Deve ser PHP 8.1+

# Verificar Composer
composer --version

# Verificar se há .env
cd backend-laravel
ls -la .env
```

### 2. Configurar Ambiente (se necessário)

Se não houver `.env`:

```bash
cd backend-laravel
cp .env.example .env
php artisan key:generate
```

Editar `.env` com suas configurações locais:

```env
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lacos_local
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
```

### 3. Instalar Dependências

```bash
cd backend-laravel
composer install
```

### 4. Configurar Banco de Dados

```bash
# Criar banco de dados (se necessário)
mysql -u root -p
CREATE DATABASE lacos_local;

# Executar migrations
php artisan migrate

# Se necessário, popular dados
php artisan db:seed
```

### 5. Iniciar Servidor

```bash
cd backend-laravel
php artisan serve
```

O servidor estará disponível em: `http://localhost:8000`

### 6. Verificar se Está Funcionando

```bash
# Testar endpoint de status
curl http://localhost:8000/api/gateway/status

# Deve retornar:
# {"status":"ativo"}
```

## 📱 Configurar App React Native

### Status Atual

O app já está configurado para usar o backend local:
- **URL**: `http://localhost:8000/api`
- **Arquivo**: `src/config/api.js`

### Para Android

O Android precisa usar o IP da máquina, não `localhost`:

1. Descobrir seu IP local:
```bash
# Linux/Mac
ip addr show | grep "inet " | grep -v 127.0.0.1

# Ou
hostname -I | awk '{print $1}'
```

2. Atualizar configuração:
```bash
# Editar src/config/api.js
# Trocar localhost pelo seu IP (ex: 192.168.1.100)
BASE_URL: 'http://192.168.1.100:8000/api',
```

### Para iOS Simulator

iOS Simulator pode usar `localhost` normalmente.

### Para Dispositivo Físico

Use o IP da máquina (mesmo processo do Android).

## 🔄 Voltar para Servidor Remoto

Se precisar voltar ao servidor remoto:

```bash
# Restaurar backup
cp src/config/api.js.backup.* src/config/api.js

# Ou editar manualmente
# BASE_URL: 'http://192.168.0.20/api',
```

## 🛠️ Scripts Disponíveis

### Atualizar Backend Local

```bash
bash scripts/ATUALIZAR_BACKEND_LOCAL.sh
```

### Apontar App para Local

```bash
bash scripts/APONTAR_APP_PARA_LOCAL.sh
```

### Apontar App para Remoto

```bash
# Editar manualmente src/config/api.js
# Ou restaurar backup
```

## ⚠️ Problemas Comuns

### 1. CORS Error

Adicionar no `backend-laravel/config/cors.php`:

```php
'paths' => ['api/*'],
'allowed_origins' => ['*'],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
```

### 2. Connection Refused

- Verificar se o servidor está rodando: `php artisan serve`
- Verificar porta: `netstat -tuln | grep 8000`
- Verificar firewall

### 3. Android não conecta

- Usar IP da máquina em vez de `localhost`
- Verificar se dispositivo e computador estão na mesma rede
- Verificar se porta 8000 está acessível

### 4. Banco de Dados

- Verificar se MySQL está rodando
- Verificar credenciais no `.env`
- Verificar se banco existe: `mysql -u root -p -e "SHOW DATABASES;"`

## 📋 Checklist

- [ ] Backend atualizado (`git pull`)
- [ ] `.env` configurado
- [ ] Dependências instaladas (`composer install`)
- [ ] Banco de dados criado e migrations executadas
- [ ] Servidor rodando (`php artisan serve`)
- [ ] App configurado para localhost ou IP local
- [ ] Testado endpoint: `curl http://localhost:8000/api/gateway/status`

## 🔍 Verificar Status

```bash
# Verificar se servidor está rodando
ps aux | grep "php artisan serve"

# Verificar porta
netstat -tuln | grep 8000

# Testar API
curl http://localhost:8000/api/gateway/status
```

## 📝 Notas

- O backup da configuração anterior está em: `src/config/api.js.backup.*`
- Mudanças locais do backend foram salvas em stash: `git stash list`
- Para restaurar mudanças: `cd backend-laravel && git stash pop`












