# Instalar Backend Laravel Local Completo

## ⚠️ Problema Identificado

O diretório `backend-laravel` não é um projeto Laravel completo - não tem o arquivo `artisan`. É apenas uma pasta com arquivos PHP soltos.

## ✅ Solução

Você precisa clonar o projeto Laravel completo do repositório.

## 🚀 Método 1: Script Automatizado

```bash
bash scripts/CLONAR_BACKEND_LARAVEL.sh
```

O script irá:
1. Clonar o repositório `gateway-lacos-` do GitHub
2. Instalar dependências com `composer install`
3. Copiar o `.env` do backup
4. Configurar o projeto

## 🚀 Método 2: Manual

### 1. Clonar repositório

```bash
cd /home/darley/lacos
git clone https://github.com/dev-catena/gateway-lacos-.git backend-laravel-completo
cd backend-laravel-completo
```

### 2. Instalar dependências

```bash
composer install
```

### 3. Configurar .env

```bash
# Copiar .env do backup
cp ../backend-laravel/.env .env

# Ou criar do exemplo
cp .env.example .env
php artisan key:generate

# Editar .env com suas configurações
nano .env
```

### 4. Configurar banco de dados

Editar `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lacos
DB_USERNAME=lacos
DB_PASSWORD=Lacos2025Secure
```

### 5. Executar migrations

```bash
php artisan migrate
```

### 6. Iniciar servidor

```bash
php artisan serve --host 0.0.0.0 --port 8000
```

## 📋 Verificação

Após clonar e configurar:

```bash
cd backend-laravel-completo

# Verificar se artisan existe
ls -la artisan

# Testar conexão com banco
php artisan db:show

# Verificar rotas
php artisan route:list | head -20
```

## 🔧 Se o Repositório Não Estiver Disponível

Se o repositório não estiver acessível, você pode:

### Opção 1: Criar projeto Laravel novo

```bash
cd /home/darley/lacos
composer create-project laravel/laravel backend-laravel-completo
cd backend-laravel-completo

# Copiar arquivos do backend-laravel
cp -r ../backend-laravel/app/* app/
cp -r ../backend-laravel/routes/* routes/
cp -r ../backend-laravel/config/* config/
cp ../backend-laravel/.env .env

# Instalar dependências
composer install
php artisan key:generate
```

### Opção 2: Usar backend do servidor

Se você tem acesso SSH ao servidor, pode copiar o projeto:

```bash
# Do servidor para local
scp -r darley@192.168.0.20:/var/www/lacos-backend /home/darley/lacos/backend-laravel-completo
```

## 🚀 Iniciar Servidor

Após ter o projeto completo:

```bash
cd backend-laravel-completo
php artisan serve --host 0.0.0.0 --port 8000
```

## 📝 Notas

- O diretório `backend-laravel` atual contém apenas arquivos PHP soltos
- Você precisa de um projeto Laravel completo com `artisan`
- O `.env` já está configurado e pode ser copiado
- O banco de dados `lacos` já existe localmente












