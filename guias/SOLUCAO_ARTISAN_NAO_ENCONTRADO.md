# Solução: artisan não encontrado

## ⚠️ Problema

O diretório `backend-laravel` não contém um projeto Laravel completo:
- ❌ Não tem arquivo `artisan`
- ❌ Não tem `composer.json` na raiz
- ✅ Tem apenas arquivos PHP soltos (controllers, models, etc.)

## ✅ Solução

Criar um projeto Laravel completo e copiar os arquivos do `backend-laravel`.

## 🚀 Método 1: Script Automatizado (Recomendado)

```bash
bash scripts/CRIAR_BACKEND_LARAVEL_COMPLETO.sh
```

O script irá:
1. Criar um projeto Laravel novo com `composer create-project`
2. Copiar o `.env` do backup
3. Copiar controllers, services, models, migrations, rotas
4. Instalar dependências
5. Gerar chave da aplicação

## 🚀 Método 2: Manual

### 1. Criar projeto Laravel

```bash
cd /home/darley/lacos
composer create-project laravel/laravel backend-laravel-completo
cd backend-laravel-completo
```

### 2. Copiar .env

```bash
cp ../backend-laravel/.env .env
php artisan key:generate
```

### 3. Copiar arquivos

```bash
# Controllers
mkdir -p app/Http/Controllers/Api
cp -r ../backend-laravel/app/Http/Controllers/Api/* app/Http/Controllers/Api/

# Services
mkdir -p app/Services
cp -r ../backend-laravel/app/Services/* app/Services/

# Models
mkdir -p app/Models
cp -r ../backend-laravel/app/Models/* app/Models/

# Migrations
cp -r ../backend-laravel/database/migrations/* database/migrations/

# Rotas
cp ../backend-laravel/routes/api.php routes/api.php

# Configurações
cp -r ../backend-laravel/config/* config/
```

### 4. Instalar dependências

```bash
composer install
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

Após criar o projeto:

```bash
cd backend-laravel-completo

# Verificar se artisan existe
ls -la artisan

# Verificar estrutura
ls -la app/Http/Controllers/Api/ | head -10

# Testar servidor
php artisan serve --host 0.0.0.0 --port 8000
```

## 🔧 Configurações Importantes

O `.env` já está configurado com:
- `APP_ENV=local`
- `APP_DEBUG=true`
- `APP_URL=http://localhost:8000`
- `DB_PASSWORD=Lacos2025Secure`

## ⚠️ Notas

- O diretório `backend-laravel` original será mantido
- O novo projeto será criado em `backend-laravel-completo`
- Todos os arquivos serão copiados automaticamente
- Você pode precisar ajustar namespaces e imports

## 🚀 Após Criar

```bash
cd backend-laravel-completo
php artisan serve --host 0.0.0.0 --port 8000
```

O servidor estará disponível em: `http://localhost:8000`












