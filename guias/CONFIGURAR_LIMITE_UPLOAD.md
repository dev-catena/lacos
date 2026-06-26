# 🔧 Configurar Limite de Upload no Servidor

## ❌ Problema
Erro 413 (Payload Too Large) ao fazer upload de arquivos, mesmo arquivos pequenos (1-2MB).

## 🔍 Causa
O servidor web (nginx/apache) ou PHP tem um limite de upload menor que o configurado no Laravel.

## ✅ Solução rápida (servidor de produção)

No servidor `gateway.lacosapp.com` (193.203.182.22):

```bash
cd /var/www/lacos
sudo git pull   # ou copie scripts/fix-upload-limits.sh
sudo bash scripts/fix-upload-limits.sh
```

O script define **160M** no Nginx e PHP. O limite padrão do Nginx é **1M** — por isso vídeos de ~6MB falham com HTTP 413.

## ✅ Solução manual

### 1. **Configurar PHP (php.ini)**

Edite o arquivo `php.ini`:

```ini
upload_max_filesize = 50M
post_max_size = 50M
max_execution_time = 300
max_input_time = 300
memory_limit = 256M
```

**Localização do php.ini:**
```bash
# Encontrar o php.ini em uso
php --ini

# Ou verificar no PHP-FPM
php-fpm -i | grep "Loaded Configuration File"
```

**Reiniciar PHP-FPM após alterar:**
```bash
sudo systemctl restart php8.1-fpm  # Ajuste a versão
# ou
sudo service php-fpm restart
```

### 2. **Configurar Nginx**

Edite o arquivo de configuração do nginx (geralmente em `/etc/nginx/sites-available/seu-site`):

```nginx
server {
    # ... outras configurações ...
    
    client_max_body_size 50M;
    client_body_timeout 300s;
    
    location ~ \.php$ {
        # ... outras configurações ...
        fastcgi_read_timeout 300;
    }
}
```

**Reiniciar Nginx:**
```bash
sudo nginx -t  # Testar configuração
sudo systemctl restart nginx
```

### 3. **Configurar Apache**

Edite o arquivo `.htaccess` na raiz do projeto Laravel ou no arquivo de configuração do Apache:

```apache
php_value upload_max_filesize 50M
php_value post_max_size 50M
php_value max_execution_time 300
php_value max_input_time 300
```

**Ou no arquivo de configuração do Apache:**
```apache
<Directory /var/www/seu-projeto>
    php_value upload_max_filesize 50M
    php_value post_max_size 50M
    php_value max_execution_time 300
    php_value max_input_time 300
</Directory>
```

**Reiniciar Apache:**
```bash
sudo systemctl restart apache2  # Ubuntu/Debian
sudo systemctl restart httpd  # CentOS/RHEL
```

### 4. **Verificar Configuração Atual**

```bash
# Verificar limites do PHP
php -i | grep -E "upload_max_filesize|post_max_size|max_execution_time"

# Ou criar um arquivo info.php temporário
<?php phpinfo(); ?>
```

### 5. **Valores Recomendados**

Para o projeto Laços:
- **Imagens**: até 10MB
- **Vídeos**: até 50MB
- **Timeout**: 5 minutos (300 segundos)

**Configuração mínima recomendada:**
```ini
upload_max_filesize = 50M
post_max_size = 50M
max_execution_time = 300
max_input_time = 300
memory_limit = 256M
```

**No Nginx:**
```nginx
client_max_body_size 50M;
client_body_timeout 300s;
```

## 🧪 Testar

Após configurar, teste fazendo upload de um arquivo:

```bash
curl -X POST "http://seu-servidor/api/groups/1/media" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "file=@teste.jpg" \
  -F "type=image"
```

## ⚠️ Importante

1. **Sempre reinicie o servidor** após alterar configurações
2. **Teste a configuração** antes de colocar em produção
3. **Monitore os logs** para verificar se há outros problemas
4. **Considere usar CDN** para arquivos grandes em produção

## 📝 Notas

- O Laravel já está configurado para aceitar até 10MB (imagens) e 50MB (vídeos)
- O problema está na camada do servidor web/PHP que bloqueia antes do Laravel processar
- Arquivos muito grandes podem causar timeout mesmo com limites aumentados

