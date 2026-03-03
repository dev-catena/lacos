# Ajustar .env para Ambiente Local

O `.env` foi restaurado do backup do servidor. Para usar localmente, você precisa ajustar algumas configurações.

## ✅ O que foi feito

- ✅ `.env` restaurado de: `/home/darley/lacos/.env_COMPLETO_SERVIDOR`
- ✅ Configurações básicas ajustadas para local:
  - `APP_ENV=local`
  - `APP_DEBUG=true`
  - `APP_URL=http://localhost:8000`

## ⚙️ Configurações que podem precisar de ajuste

### 1. Banco de Dados

O `.env` atual está configurado para:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lacos
DB_USERNAME=lacos
DB_PASSWORD=Lacos2025Secure
```

**Verificar:**
- Se o banco `lacos` existe localmente
- Se as credenciais estão corretas
- Se o MySQL está rodando

**Para criar banco local (se necessário):**
```bash
mysql -u root -p
CREATE DATABASE lacos;
CREATE USER 'lacos'@'localhost' IDENTIFIED BY 'Lacos2025Secure';
GRANT ALL PRIVILEGES ON lacos.* TO 'lacos'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Log Level

Para desenvolvimento, você pode querer mais logs:
```env
LOG_LEVEL=debug  # Em vez de 'error'
```

### 3. Cache e Session

Para desenvolvimento local, pode usar:
```env
CACHE_DRIVER=file
SESSION_DRIVER=file
```

### 4. Outras Configurações

- **Pusher**: Se não estiver usando em local, pode deixar como está
- **Stripe**: Se não estiver testando pagamentos, pode deixar como está
- **Mail**: Se precisar testar emails, configure `MAIL_*`

## 🔍 Verificar Configuração

```bash
cd backend-laravel

# Verificar se .env está correto
php artisan config:show

# Testar conexão com banco
php artisan tinker
>>> DB::connection()->getPdo();
```

## 🚀 Próximos Passos

1. **Verificar banco de dados:**
   ```bash
   mysql -u lacos -pLacos2025Secure -e "SHOW DATABASES;"
   ```

2. **Executar migrations (se necessário):**
   ```bash
   cd backend-laravel
   php artisan migrate
   ```

3. **Iniciar servidor:**
   ```bash
   php artisan serve
   ```

4. **Testar:**
   ```bash
   curl http://localhost:8000/api/gateway/status
   ```

## 📝 Scripts Disponíveis

### Restaurar .env do backup:
```bash
bash scripts/RESTAURAR_ENV_BACKUP.sh
```

### Ajustar para local (já executado):
```bash
cd backend-laravel
sed -i 's/APP_ENV=production/APP_ENV=local/' .env
sed -i 's/APP_DEBUG=false/APP_DEBUG=true/' .env
sed -i 's|APP_URL=http://192.168.0.20|APP_URL=http://localhost:8000|' .env
```

## ⚠️ Importante

- O `.env` contém informações sensíveis (senhas, chaves)
- Não commite o `.env` no Git
- Mantenha backups seguros
- Para produção, use variáveis de ambiente ou secrets












