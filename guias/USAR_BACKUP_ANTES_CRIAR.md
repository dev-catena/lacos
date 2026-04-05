# 📦 Usar Backup Antes de Criar Arquivos

## 🎯 Objetivo

Sempre verificar o backup antes de criar ou copiar arquivos faltantes (controllers, models, migrations, services).

## 📁 Locais de Backup

Os scripts verificam automaticamente em:
1. `/home/darley/lacos/backup`
2. `/home/darley/lacos/backups`
3. `/home/darley/lacos_backups` (pode conter arquivos `.tar.gz`)

## 🔍 Scripts Disponíveis

### 1. Buscar Arquivo no Backup

```bash
bash scripts/BUSCAR_ARQUIVO_BACKUP.sh <nome_arquivo>
```

**Exemplos:**
```bash
# Buscar AuthController
bash scripts/BUSCAR_ARQUIVO_BACKUP.sh AuthController

# Buscar User model
bash scripts/BUSCAR_ARQUIVO_BACKUP.sh User

# Buscar WhatsAppService
bash scripts/BUSCAR_ARQUIVO_BACKUP.sh WhatsAppService
```

**Funcionalidades:**
- Busca em diretórios de backup
- Busca dentro de arquivos `.tar.gz`
- Mostra localização e informações dos arquivos

### 2. Verificar e Copiar do Backup

```bash
bash scripts/VERIFICAR_BACKUP_ANTES_CRIAR.sh <tipo> <nome_arquivo>
```

**Tipos disponíveis:**
- `controller` - Controllers
- `model` - Models
- `migration` - Migrations
- `service` - Services

**Exemplos:**
```bash
# Verificar e copiar AuthController
bash scripts/VERIFICAR_BACKUP_ANTES_CRIAR.sh controller AuthController

# Verificar e copiar User model
bash scripts/VERIFICAR_BACKUP_ANTES_CRIAR.sh model User

# Verificar e copiar migration
bash scripts/VERIFICAR_BACKUP_ANTES_CRIAR.sh migration 2024_01_01_create_users_table

# Verificar e copiar WhatsAppService
bash scripts/VERIFICAR_BACKUP_ANTES_CRIAR.sh service WhatsAppService
```

## 📋 Fluxo Recomendado

### Quando encontrar arquivo faltando:

1. **Buscar no backup primeiro:**
   ```bash
   bash scripts/BUSCAR_ARQUIVO_BACKUP.sh NomeDoArquivo
   ```

2. **Se encontrar, copiar:**
   ```bash
   bash scripts/VERIFICAR_BACKUP_ANTES_CRIAR.sh <tipo> NomeDoArquivo
   ```

3. **Se encontrar dentro de .tar.gz:**
   ```bash
   # Extrair temporariamente
   cd /tmp
   tar -xzf /home/darley/lacos_backups/lacos_backup_*.tar.gz
   
   # Copiar arquivo
   cp caminho/do/arquivo.php /home/darley/lacos/backend-laravel/app/...
   ```

4. **Se não encontrar no backup:**
   - Verificar se está no projeto temporário (`backend-laravel-temp`)
   - Verificar se está na raiz do `backend-laravel`
   - Criar apenas como último recurso

## 🔍 Locais Verificados pelo Script

### Controllers
- `backup/backend-laravel/app/Http/Controllers/Api/`
- `backup/backend-laravel/app/Http/Controllers/`
- `backup/backend-laravel/`
- `backup/`
- Dentro de arquivos `.tar.gz`

### Models
- `backup/backend-laravel/app/Models/`
- `backup/backend-laravel/app/Model/`
- `backup/backend-laravel/`
- `backup/`
- Dentro de arquivos `.tar.gz`

### Migrations
- `backup/backend-laravel/database/migrations/`
- `backup/backend-laravel/`
- `backup/`
- Dentro de arquivos `.tar.gz`

### Services
- `backup/backend-laravel/app/Services/`
- `backup/backend-laravel/`
- `backup/`
- Dentro de arquivos `.tar.gz`

## ⚠️ Importante

- **Sempre verificar o backup primeiro** antes de criar arquivos
- O backup pode ter versões mais completas ou corretas
- Arquivos do backup podem ter configurações específicas do projeto
- Verificar namespace e imports após copiar
- Se o backup estiver em `.tar.gz`, pode ser necessário extrair temporariamente

## 📝 Exemplo Completo

```bash
# 1. Descobrir que AuthController está faltando
cd backend-laravel
php artisan route:list
# Erro: Class "App\Http\Controllers\Api\AuthController" not found

# 2. Buscar no backup
bash scripts/BUSCAR_ARQUIVO_BACKUP.sh AuthController

# 3. Se encontrar, copiar
bash scripts/VERIFICAR_BACKUP_ANTES_CRIAR.sh controller AuthController

# 4. Verificar se funcionou
php artisan route:list | grep login
```

## 🔧 Extrair Arquivo de .tar.gz

Se o arquivo estiver dentro de um `.tar.gz`:

```bash
# 1. Listar conteúdo do backup
tar -tzf /home/darley/lacos_backups/lacos_backup_*.tar.gz | grep AuthController

# 2. Extrair apenas o arquivo necessário
cd /tmp
tar -xzf /home/darley/lacos_backups/lacos_backup_*.tar.gz --wildcards "*AuthController.php"

# 3. Copiar para o lugar certo
cp backend-laravel/app/Http/Controllers/Api/AuthController.php \
   /home/darley/lacos/backend-laravel/app/Http/Controllers/Api/
```

## 🚀 Atalho Rápido

Para verificar rapidamente se um arquivo existe no backup:

```bash
# Buscar em diretórios
find /home/darley/lacos_backups -name "*NomeArquivo*" -type f

# Buscar dentro de .tar.gz
tar -tzf /home/darley/lacos_backups/*.tar.gz | grep NomeArquivo
```
