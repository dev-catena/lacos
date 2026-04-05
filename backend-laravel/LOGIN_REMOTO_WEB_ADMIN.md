# Login remoto no Web Admin (192.168.0.20:8081)

## Problema
O login com `admin@lacos.com` / `admin123` funciona na máquina onde está hospedado, mas **não funciona de máquinas remotas**.

## Causas
1. **Backend (porta 8000):** Por padrão, o Laravel só aceita conexões em `127.0.0.1`
2. **Web Admin (porta 8081):** Por padrão, o Vite pode escutar só em localhost

## Solução

### 1. Iniciar o backend aceitando conexões remotas

**Use:**
```bash
cd backend-laravel
./start-backend-remote.sh
```

Ou manualmente:
```bash
php artisan serve --host=0.0.0.0 --port=8000
```

### 2. Iniciar o Web Admin (acesso remoto já habilitado)

O `npm run dev` já está configurado para escutar em `0.0.0.0:8081`, permitindo acesso remoto:

```bash
cd web-admin
npm run dev
```

O `vite.config.js` e o script `dev` do `package.json` usam `--host 0.0.0.0`, fazendo o servidor escutar em **todas as interfaces de rede**.

### 3. Firewall

Se ainda não funcionar, libere as portas:

```bash
sudo ufw allow 8000/tcp
sudo ufw allow 8081/tcp
sudo ufw reload
```

### 4. Verificar

De uma máquina remota:
```bash
# Testar se a API está acessível
curl http://192.168.0.20:8000/api/gateway/status
# Deve retornar: {"status":"ativo"}

# Testar se o Web Admin está acessível
curl -s -o /dev/null -w "%{http_code}" http://192.168.0.20:8081
# Deve retornar: 200
```

### Credenciais
- **Email:** admin@lacos.com  
- **Senha:** admin123  
