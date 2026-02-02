# 🔧 Instalar Extensão imagick (ImageMagick) no Servidor

## ❌ Erro

```
you need to install the imagick extension to use this backend
```

Este erro ocorre porque a extensão PHP `imagick` (ImageMagick) não está instalada no servidor. Ela é necessária para gerar PDFs de atestados e receitas.

## ✅ Solução

### Opção 1: Script Automático (Recomendado)

1. **Enviar o script para o servidor:**
   ```bash
   scp INSTALAR_IMAGICK_SERVIDOR.sh usuario@servidor:/tmp/
   ```

2. **Conectar ao servidor:**
   ```bash
   ssh usuario@servidor
   ```

3. **Executar o script:**
   ```bash
   bash /tmp/INSTALAR_IMAGICK_SERVIDOR.sh
   ```

### Opção 2: Instalação Manual

#### Para Ubuntu/Debian:

```bash
# Atualizar pacotes
sudo apt-get update

# Instalar ImageMagick e bibliotecas de desenvolvimento
sudo apt-get install -y libmagickwand-dev imagemagick

# Instalar extensão PHP imagick (ajuste a versão do PHP se necessário)
sudo apt-get install -y php-imagick
# OU para PHP específico (ex: PHP 8.1):
sudo apt-get install -y php8.1-imagick

# Reiniciar PHP-FPM
sudo systemctl restart php*-fpm
# OU
sudo systemctl restart php8.1-fpm

# Reiniciar Apache (se usar)
sudo systemctl restart apache2
```

#### Para CentOS/RHEL/Fedora:

```bash
# Instalar ImageMagick e bibliotecas de desenvolvimento
sudo yum install -y ImageMagick-devel ImageMagick
# OU para Fedora:
sudo dnf install -y ImageMagick-devel ImageMagick

# Instalar extensão PHP imagick
sudo yum install -y php-imagick
# OU
sudo dnf install -y php-imagick

# Reiniciar PHP-FPM
sudo systemctl restart php-fpm

# Reiniciar Apache (se usar)
sudo systemctl restart httpd
```

### Verificação

Após instalar, verifique se a extensão está disponível:

```bash
# Verificar se o módulo está carregado
php -m | grep imagick

# Ver informações da extensão
php -i | grep imagick
```

Se aparecer `imagick` na lista de módulos, a instalação foi bem-sucedida!

## 🔍 Solução de Problemas

### Se a extensão não aparecer após instalação:

1. **Verificar se o pacote foi instalado:**
   ```bash
   # Ubuntu/Debian
   dpkg -l | grep imagick
   
   # CentOS/RHEL/Fedora
   rpm -qa | grep imagick
   ```

2. **Verificar arquivo de configuração PHP:**
   ```bash
   # Encontrar diretório de configuração
   php --ini
   
   # Verificar se existe arquivo imagick.ini
   ls -la /etc/php/*/mods-available/imagick.ini
   # OU
   ls -la /etc/php.d/imagick.ini
   ```

3. **Habilitar manualmente (se necessário):**
   ```bash
   # Ubuntu/Debian
   sudo phpenmod imagick
   
   # Ou criar arquivo manualmente
   echo "extension=imagick.so" | sudo tee /etc/php/*/mods-available/imagick.ini
   ```

4. **Reiniciar serviços:**
   ```bash
   # PHP-FPM
   sudo systemctl restart php*-fpm
   
   # Apache
   sudo systemctl restart apache2  # Ubuntu/Debian
   sudo systemctl restart httpd    # CentOS/RHEL
   
   # Nginx (se usar)
   sudo systemctl restart nginx
   ```

5. **Verificar logs:**
   ```bash
   # Logs do PHP
   tail -f /var/log/php*-fpm.log
   
   # Logs do Apache
   tail -f /var/log/apache2/error.log  # Ubuntu/Debian
   tail -f /var/log/httpd/error_log    # CentOS/RHEL
   ```

### Se ainda não funcionar:

1. **Instalar via PECL (alternativa):**
   ```bash
   # Instalar dependências
   sudo apt-get install -y php-dev pkg-config libmagickwand-dev
   
   # Instalar via PECL
   sudo pecl install imagick
   
   # Adicionar ao php.ini
   echo "extension=imagick.so" | sudo tee -a /etc/php/*/php.ini
   
   # Reiniciar serviços
   sudo systemctl restart php*-fpm
   ```

2. **Verificar versão do PHP:**
   ```bash
   php -v
   ```
   Certifique-se de instalar a extensão para a versão correta do PHP.

## 📝 Notas Importantes

- A extensão `imagick` é uma interface PHP para a biblioteca ImageMagick
- É necessária para processar imagens e gerar PDFs
- Após instalar, sempre reinicie os serviços PHP/Apache/Nginx
- Se usar múltiplas versões do PHP, instale a extensão para cada versão

## 🧪 Teste

Após instalar, teste gerando um atestado:

1. Faça login como médico
2. Tente gerar um atestado
3. O erro "you need to install the imagick extension" não deve mais aparecer

