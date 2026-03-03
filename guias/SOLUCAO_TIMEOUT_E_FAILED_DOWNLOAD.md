# 🔧 Solução: Timeout Gmail e "Failed to Download Remoto"

## 📋 Problemas Identificados

1. **Gmail timeout**: Pode ser temporário ou problema de DNS/rede
2. **"Failed to download remoto"**: Expo não está rodando na porta 8081

## ✅ Diagnóstico Realizado

Execute o script de diagnóstico:
```bash
./DIAGNOSTICAR_E_CORRIGIR_CONEXAO.sh
```

Resultados típicos:
- ✅ Internet OK
- ✅ DNS funcionando  
- ✅ Gmail acessível (código 301 é normal - redirecionamento)
- ✅ IP correto: 192.168.0.20
- ❌ **Expo NÃO está rodando** ← Problema principal

## 🔧 Solução

### Opção 1: Iniciar Expo Corrigido (Recomendado)

Execute o script que corrige tudo automaticamente:
```bash
./INICIAR_EXPO_CORRIGIDO.sh
```

Este script:
1. Para processos antigos
2. Libera porta 8081
3. Limpa cache
4. Verifica conectividade
5. Configura Expo corretamente
6. Oferece escolha entre LAN e Tunnel mode

### Opção 2: Tunnel Mode (Mais Confiável)

Se tiver problemas de rede, use tunnel mode:
```bash
./INICIAR_EXPO_TUNNEL.sh
```

**Vantagens:**
- ✅ Funciona mesmo em redes diferentes
- ✅ QR code funciona normalmente
- ✅ Não depende de configuração de rede local

### Opção 3: LAN Mode com IP Forçado

Se estiver na mesma rede:
```bash
./INICIAR_EXPO_IP_FORCADO.sh
```

Depois use no Expo Go:
```
exp://192.168.0.20:8081
```

## 🧪 Verificar se Funcionou

Após iniciar o Expo, teste:

1. **Localmente:**
```bash
curl http://localhost:8081/status
```

2. **Pela rede:**
```bash
curl http://192.168.0.20:8081/status
```

3. **Ver processos:**
```bash
ps aux | grep expo
lsof -i :8081
```

## 📱 Usar no Expo Go

### Se usar LAN Mode:
1. Abra Expo Go
2. Toque em "Enter URL manually"
3. Cole: `exp://192.168.0.20:8081`

### Se usar Tunnel Mode:
1. Abra Expo Go
2. Escaneie o QR code que aparecer
3. Ou use a URL que aparecer no terminal

## ⚠️ Problemas Comuns

### "Failed to download remoto"
- **Causa**: Expo não está rodando
- **Solução**: Execute `./INICIAR_EXPO_CORRIGIDO.sh`

### Gmail timeout
- **Causa**: Pode ser temporário ou problema de DNS
- **Solução**: 
  ```bash
  sudo systemd-resolve --flush-caches
  ```
  Ou tente novamente em alguns minutos

### Porta 8081 em uso
- **Causa**: Processo antigo ainda rodando
- **Solução**: O script `INICIAR_EXPO_CORRIGIDO.sh` já resolve isso automaticamente

### QR code mostra localhost
- **Causa**: Expo detectou localhost ao invés do IP
- **Solução**: Ignore o QR code e use a URL manualmente: `exp://192.168.0.20:8081`

## 📞 Comandos Úteis

```bash
# Verificar se Expo está rodando
lsof -i :8081

# Parar Expo
pkill -f "expo start"

# Limpar cache
rm -rf .expo node_modules/.cache

# Testar conectividade
ping -c 3 8.8.8.8
curl -I https://gmail.com
```

