# 🔧 Solução: Timeout no Android ao Conectar ao Expo

## ❌ Problema

- O endereço `http://10.102.0.103:8081/` abre no navegador ✅
- Mas o Android dá **timeout** ao tentar conectar ❌

## 🔍 Causas Possíveis

1. **Firewall bloqueando** - Porta 8081 não está aberta
2. **Metro escutando apenas IPv6** - Android precisa de IPv4
3. **Rede diferente** - Celular e PC não estão na mesma Wi-Fi
4. **Expo Go desatualizado** - Versão antiga do app

---

## ✅ Solução Passo a Passo

### 1. Abrir Porta no Firewall

```bash
sudo ./scripts/ABRIR_FIREWALL_8081.sh
```

Ou manualmente:

```bash
sudo ufw allow 8081/tcp
sudo ufw reload
```

### 2. Verificar Conectividade

```bash
./scripts/VERIFICAR_FIREWALL_8081.sh
```

### 3. Reiniciar Expo com IP Fixo

```bash
# Parar Expo atual (Ctrl+C)
# Depois iniciar novamente:
npm start
```

### 4. Verificar no Android

1. Abra **Expo Go** no celular
2. Escaneie o QR code
3. O QR code deve mostrar: `exp://10.102.0.103:8081`

---

## 🔍 Diagnóstico

### Teste 1: Verificar se Metro está acessível

No **celular Android**, abra o navegador e tente acessar:
```
http://10.102.0.103:8081/status
```

**Se funcionar no navegador do celular:**
- ✅ Rede está OK
- ✅ Firewall está OK
- ❌ Problema é no Expo Go

**Se NÃO funcionar no navegador do celular:**
- ❌ Firewall bloqueando OU
- ❌ Celular e PC em redes diferentes

### Teste 2: Verificar IP do PC

```bash
hostname -I
```

Deve mostrar: `10.102.0.103`

### Teste 3: Ping do Celular para PC

No celular, instale um app de ping ou use terminal (se tiver root):
```
ping 10.102.0.103
```

**Se ping funcionar:**
- ✅ Rede está OK
- Problema é no Expo/Metro

**Se ping NÃO funcionar:**
- ❌ Celular e PC em redes diferentes
- ❌ Firewall bloqueando ICMP

---

## 🛠️ Soluções Alternativas

### Solução 1: Usar Tunnel (se LAN não funcionar)

```bash
npm start -- --tunnel
```

**⚠️ ATENÇÃO:** Tunnel pode mudar a URL, mas funciona mesmo em redes diferentes.

### Solução 2: Verificar Versão do Expo Go

1. Abra Google Play Store
2. Procure "Expo Go"
3. Atualize se houver atualização disponível

### Solução 3: Limpar Cache do Expo Go

No Android:
1. Configurações → Apps → Expo Go
2. Armazenamento → Limpar Cache
3. Tentar conectar novamente

---

## 📱 Configuração do Metro

O `metro.config.js` já está configurado para:
- ✅ Escutar em `0.0.0.0` (todas as interfaces)
- ✅ Substituir localhost por `10.102.0.103`
- ✅ Adicionar CORS headers
- ✅ Interceptar todas as respostas HTTP

---

## 🔧 Comandos Úteis

```bash
# Ver processos na porta 8081
lsof -i :8081

# Matar processo na porta 8081
lsof -ti :8081 | xargs kill -9

# Verificar firewall
sudo ufw status

# Abrir porta
sudo ufw allow 8081/tcp

# Testar conectividade
curl http://10.102.0.103:8081/status
```

---

## ⚠️ Checklist

Antes de reportar problema, verifique:

- [ ] Firewall está aberto? (`sudo ufw allow 8081/tcp`)
- [ ] Celular e PC na mesma rede Wi-Fi?
- [ ] IP do PC é `10.102.0.103`?
- [ ] Metro está rodando? (`netstat -tlnp | grep 8081`)
- [ ] Expo Go está atualizado?
- [ ] QR code mostra `exp://10.102.0.103:8081`?
- [ ] Navegador do celular consegue acessar `http://10.102.0.103:8081`?

---

**Última atualização:** 2025-01-24















