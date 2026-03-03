# 🔧 Solução: Problemas de Conexão Backend no Web

## ❌ Problema

Dificuldade de conexão com backend ao desenvolver no web.

## 🔍 Diagnóstico

### Passo 1: Verificar Backend via SSH

```bash
./VERIFICAR_BACKEND_SSH.sh
```

Este script vai:
- ✅ Conectar via SSH (porta 63022)
- ✅ Verificar se backend existe
- ✅ Verificar se Laravel está configurado
- ✅ Verificar se servidor web está rodando
- ✅ Verificar configuração CORS
- ✅ Testar endpoint localmente no servidor
- ✅ Verificar firewall

### Passo 2: Configurar CORS

Se CORS não estiver configurado:

```bash
./CONFIGURAR_CORS_BACKEND.sh
```

Este script vai:
- ✅ Conectar via SSH (porta 63022)
- ✅ Criar/atualizar `config/cors.php`
- ✅ Adicionar localhost:8081 e localhost:19006
- ✅ Adicionar padrões para IPs locais
- ✅ Limpar cache do Laravel

## ✅ Soluções

### Solução 1: Configurar CORS (Mais Comum)

O problema mais comum é CORS não permitir requisições do Expo Web.

**Execute:**
```bash
./CONFIGURAR_CORS_BACKEND.sh
```

**Isso vai adicionar ao `config/cors.php`:**
- `http://localhost:8081` (Expo Web)
- `http://localhost:19006` (Expo Web alternativo)
- `http://127.0.0.1:8081`
- `http://192.168.0.20:8081` (seu IP local)
- Padrões para IPs locais

### Solução 2: Verificar Backend

Se backend não está respondendo:

```bash
./VERIFICAR_BACKEND_SSH.sh
```

**Isso vai verificar:**
- Se backend existe
- Se Laravel está configurado
- Se nginx/apache está rodando
- Se firewall está bloqueando
- Se endpoint responde localmente

### Solução 3: Verificar Firewall

Se firewall está bloqueando:

**No servidor:**
```bash
ssh -p 63022 darley@192.168.0.20
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

### Solução 4: Verificar Servidor Web

Se nginx/apache não está rodando:

**No servidor:**
```bash
ssh -p 63022 darley@192.168.0.20
sudo systemctl status nginx
# ou
sudo systemctl status apache2

# Se não estiver rodando:
sudo systemctl start nginx
# ou
sudo systemctl start apache2
```

## 📋 Checklist

- [ ] Backend existe? (`./VERIFICAR_BACKEND_SSH.sh`)
- [ ] CORS está configurado? (`./CONFIGURAR_CORS_BACKEND.sh`)
- [ ] Servidor web está rodando? (verificar no servidor)
- [ ] Firewall permite porta 80? (verificar no servidor)
- [ ] Backend responde localmente? (`./VERIFICAR_BACKEND_SSH.sh`)

## 🚀 Próximos Passos

1. **Execute diagnóstico:**
   ```bash
   ./VERIFICAR_BACKEND_SSH.sh
   ```

2. **Configure CORS:**
   ```bash
   ./CONFIGURAR_CORS_BACKEND.sh
   ```

3. **Teste novamente:**
   ```bash
   npm run web
   ```

4. **Verifique console do navegador (F12)** para ver erros específicos

## 💡 Dica

Se ainda tiver problemas após configurar CORS:
- Verifique console do navegador (F12 > Network)
- Veja o erro específico (CORS, timeout, 404, etc)
- Verifique se backend está realmente acessível de fora

