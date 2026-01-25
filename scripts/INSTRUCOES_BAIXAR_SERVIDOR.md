# 📥 Instruções para Baixar Arquivos do Servidor

## Método 1: Usando SSH Manual

### Passo 1: Conectar ao servidor
```bash
ssh -p 63022 darley@10.102.0.103
```

### Passo 2: Executar script de backup no servidor
```bash
# Copiar o script para o servidor primeiro
scp -P 63022 scripts/CRIAR_BACKUP_SERVIDOR.sh darley@10.102.0.103:/tmp/

# Conectar e executar
ssh -p 63022 darley@10.102.0.103
bash /tmp/CRIAR_BACKUP_SERVIDOR.sh
```

### Passo 3: Baixar o arquivo de backup
```bash
# O script mostrará o nome do arquivo, algo como:
scp -P 63022 darley@10.102.0.103:/tmp/lacos_backup_*.tar.gz /tmp/lacos_backup.tar.gz
```

### Passo 4: Extrair no projeto local
```bash
cd /home/darley/lacos/backend-laravel
tar -xzf /tmp/lacos_backup.tar.gz
```

## Método 2: Usando rsync (se SSH key estiver configurada)

```bash
# Controllers
rsync -avz -e "ssh -p 63022" darley@10.102.0.103:/var/www/lacos-backend/app/Http/Controllers/ backend-laravel/app/Http/Controllers/

# Models
rsync -avz -e "ssh -p 63022" darley@10.102.0.103:/var/www/lacos-backend/app/Models/ backend-laravel/app/Models/

# Migrations
rsync -avz -e "ssh -p 63022" darley@10.102.0.103:/var/www/lacos-backend/database/migrations/ backend-laravel/database/migrations/
```

## Método 3: Listar e baixar arquivos individuais

### Listar arquivos no servidor:
```bash
ssh -p 63022 darley@10.102.0.103 "find /var/www/lacos-backend/app/Http/Controllers -name '*.php' -type f"
ssh -p 63022 darley@10.102.0.103 "find /var/www/lacos-backend/app/Models -name '*.php' -type f"
ssh -p 63022 darley@10.102.0.103 "find /var/www/lacos-backend/database/migrations -name '*.php' -type f"
```

### Baixar arquivos individuais:
```bash
# Exemplo para um controller
scp -P 63022 darley@10.102.0.103:/var/www/lacos-backend/app/Http/Controllers/Api/AuthController.php backend-laravel/app/Http/Controllers/Api/
```

## Método 4: Script Automático (requer autenticação SSH configurada)

Execute o script:
```bash
./scripts/SINCRONIZAR_SERVIDOR_COMPLETO.sh
```





