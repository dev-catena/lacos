# Configurar Senha do Banco: Lacos2025Secure

## ✅ O que foi feito

- ✅ Senha atualizada no `.env`: `Lacos2025Secure`
- ⚠️  Senha no MySQL precisa ser atualizada para `Lacos2025Secure`

## 🔐 Atualizar Senha no MySQL

### Método 1: Script Automatizado (Recomendado)

```bash
bash scripts/ATUALIZAR_SENHA_MYSQL_LACOS.sh
```

O script irá:
1. Solicitar a senha do root do MySQL
2. Atualizar a senha do usuário `lacos` para `Lacos2025Secure`
3. Criar o usuário se não existir
4. Testar a conexão

### Método 2: Manual

```bash
# Conectar como root
mysql -u root -p

# Executar comandos SQL
ALTER USER 'lacos'@'localhost' IDENTIFIED BY 'Lacos2025Secure';
FLUSH PRIVILEGES;
```

### Método 3: Se o usuário não existir

```bash
mysql -u root -p

# Criar usuário e dar permissões
CREATE USER 'lacos'@'localhost' IDENTIFIED BY 'Lacos2025Secure';
GRANT ALL PRIVILEGES ON lacos.* TO 'lacos'@'localhost';
FLUSH PRIVILEGES;
```

## 📋 Configurações Finais

No arquivo `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lacos
DB_USERNAME=lacos
DB_PASSWORD=Lacos2025Secure
```

No MySQL:
- Usuário: `lacos`
- Senha: `Lacos2025Secure`
- Banco: `lacos`

## 🔍 Testar Conexão

Após atualizar a senha no MySQL:

```bash
# Testar conexão
bash scripts/TESTAR_CONEXAO_BANCO.sh

# Ou manualmente
mysql -u lacos -pLacos2025Secure -e "USE lacos; SHOW TABLES;"
```

## ✅ Verificação Completa

Para verificar se tudo está configurado corretamente:

```bash
# 1. Verificar .env
cd backend-laravel
grep "^DB_PASSWORD" .env
# Deve mostrar: DB_PASSWORD=Lacos2025Secure

# 2. Testar conexão MySQL
mysql -u lacos -pLacos2025Secure -e "USE lacos; SELECT 'Conexão OK!' as Status;"

# 3. Verificar tabelas
mysql -u lacos -pLacos2025Secure -e "USE lacos; SHOW TABLES;"
```

## 🚀 Próximos Passos

1. **Atualizar senha no MySQL:**
   ```bash
   bash scripts/ATUALIZAR_SENHA_MYSQL_LACOS.sh
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

## ⚠️ Importante

- A senha no `.env` já está como `Lacos2025Secure`
- Você precisa atualizar a senha no MySQL para corresponder
- Execute o script `ATUALIZAR_SENHA_MYSQL_LACOS.sh` para sincronizar








