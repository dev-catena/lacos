# 🔧 Solução para Erro de Migration - Sensor de Queda

## ❌ Erro Encontrado

```
SQLSTATE[HY000] [1698] Access denied for user 'root'@'localhost'
```

Este erro ocorre quando o MySQL/MariaDB está configurado para usar autenticação via socket Unix ao invés de senha.

## ✅ Soluções

### Solução 1: Executar com usuário www-data (Recomendado)

```bash
cd /var/www/lacos-backend
sudo -u www-data php artisan migrate --path=database/migrations/YYYY_MM_DD_HHMMSS_create_fall_sensor_data_table.php --force
```

### Solução 2: Executar Migration Manualmente via SQL

Se a solução 1 não funcionar, execute o SQL diretamente:

```bash
cd /var/www/lacos-backend

# Conectar ao MySQL
sudo mysql -u root

# Ou se tiver senha:
mysql -u root -p
```

Depois execute o SQL:

```sql
USE laravel;

CREATE TABLE IF NOT EXISTS fall_sensor_data (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    sensor_mac VARCHAR(17) NULL,
    posture ENUM('standing', 'sitting', 'lying_ventral', 'lying_dorsal', 'lying_lateral_right', 'lying_lateral_left', 'fall') DEFAULT 'standing',
    posture_pt VARCHAR(50) NULL,
    acceleration_x DECIMAL(10, 6) NULL,
    acceleration_y DECIMAL(10, 6) NULL,
    acceleration_z DECIMAL(10, 6) NULL,
    gyro_x DECIMAL(10, 6) NULL,
    gyro_y DECIMAL(10, 6) NULL,
    gyro_z DECIMAL(10, 6) NULL,
    magnitude DECIMAL(10, 6) NULL,
    is_fall_detected BOOLEAN DEFAULT FALSE,
    confidence DECIMAL(5, 2) NULL,
    sensor_timestamp TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_group_id (group_id),
    INDEX idx_user_id (user_id),
    INDEX idx_posture (posture),
    INDEX idx_is_fall_detected (is_fall_detected),
    INDEX idx_sensor_timestamp (sensor_timestamp),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Solução 3: Verificar e Corrigir Credenciais do .env

```bash
cd /var/www/lacos-backend

# Verificar configuração do banco
grep DB_ .env

# Se necessário, editar o .env
sudo nano .env
```

Certifique-se de que as credenciais estão corretas:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=seu_usuario
DB_PASSWORD=sua_senha
```

Depois limpe o cache:

```bash
php artisan config:clear
php artisan cache:clear
```

### Solução 4: Usar Script Completo

Execute o script completo que tenta automaticamente diferentes métodos:

```bash
cd /var/www/lacos-backend
bash INSTALAR_SENSOR_QUEDA_COMPLETO.sh
```

## 📋 Verificação Pós-Instalação

Após executar a migration, verifique se a tabela foi criada:

```bash
cd /var/www/lacos-backend
php artisan tinker
```

```php
// Verificar se a tabela existe
DB::table('fall_sensor_data')->count();

// Ou verificar estrutura
DB::select('DESCRIBE fall_sensor_data');
```

## 🔍 Troubleshooting Adicional

### Verificar Permissões do Usuário MySQL

```bash
sudo mysql -u root
```

```sql
-- Verificar usuários
SELECT user, host, plugin FROM mysql.user WHERE user = 'root';

-- Se necessário, criar/atualizar usuário
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'sua_senha';
FLUSH PRIVILEGES;
```

### Verificar se o Banco Existe

```sql
SHOW DATABASES;
USE laravel;
SHOW TABLES;
```

## ✅ Após Resolver

1. Copie os arquivos Model e Controller para os diretórios corretos
2. Verifique se as rotas foram adicionadas
3. Teste a API

