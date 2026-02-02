# Atualizar Senha do Banco de Dados

## ✅ O que foi feito

- ✅ Senha atualizada no `.env`: `pLacos2025Secure`
- ⚠️  Senha no MySQL ainda precisa ser atualizada

## 🔐 Atualizar Senha no MySQL

### Método 1: Script Automatizado

```bash
bash scripts/ATUALIZAR_SENHA_BANCO.sh
```

O script irá:
1. Solicitar a senha do root do MySQL
2. Atualizar a senha do usuário `lacos`
3. Testar a conexão

### Método 2: Manual

```bash
# Conectar como root
mysql -u root -p

# Executar comandos SQL
ALTER USER 'lacos'@'localhost' IDENTIFIED BY 'pLacos2025Secure';
FLUSH PRIVILEGES;
```

### Método 3: Se o usuário não existir

```bash
mysql -u root -p

# Criar usuário e dar permissões
CREATE USER 'lacos'@'localhost' IDENTIFIED BY 'pLacos2025Secure';
GRANT ALL PRIVILEGES ON lacos.* TO 'lacos'@'localhost';
FLUSH PRIVILEGES;
```

## 🔍 Testar Conexão

Após atualizar a senha no MySQL:

```bash
# Testar conexão
mysql -u lacos -ppLacos2025Secure -e "USE lacos; SHOW TABLES;"

# Ou usar o script
bash scripts/TESTAR_CONEXAO_BANCO.sh
```

## 📋 Configurações Atuais

No arquivo `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lacos
DB_USERNAME=lacos
DB_PASSWORD=pLacos2025Secure
```

## ⚠️ Importante

- A senha no `.env` já foi atualizada
- Você precisa atualizar a senha no MySQL também
- Execute o script `ATUALIZAR_SENHA_BANCO.sh` ou faça manualmente

## 🚀 Próximos Passos

1. **Atualizar senha no MySQL:**
   ```bash
   bash scripts/ATUALIZAR_SENHA_BANCO.sh
   ```

2. **Testar conexão:**
   ```bash
   bash scripts/TESTAR_CONEXAO_BANCO.sh
   ```

3. **Se tudo estiver OK, iniciar o servidor Laravel:**
   ```bash
   cd backend-laravel
   php artisan serve
   ```








