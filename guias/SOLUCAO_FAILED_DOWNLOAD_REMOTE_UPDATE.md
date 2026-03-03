# 🔧 Solução: "failed to download remote update" no iOS e Android

## ❌ Problema

- **iOS**: "there was a problem running the request app unknown error: the request timeout"
- **Android**: "uncaught error java.io.IOException: failed to download remote update"

**Causa**: O Metro bundler está retornando URLs com `localhost` nas respostas HTTP, e os dispositivos iOS/Android não conseguem acessar localhost do servidor.

## ✅ Solução Definitiva

### Script Principal: `INICIAR_EXPO_SEM_LOCALHOST_DEFINITIVO.sh`

Este script garante que **NENHUMA URL use localhost**:

```bash
./INICIAR_EXPO_SEM_LOCALHOST_DEFINITIVO.sh
```

**O que este script faz:**
1. ✅ Para todos os processos Expo/Metro
2. ✅ Limpa cache completamente
3. ✅ Configura metro.config.js para interceptar TODAS as respostas HTTP
4. ✅ Substitui localhost pelo IP correto (192.168.0.20) em:
   - URLs nas respostas HTTP
   - Headers HTTP
   - Corpo das respostas JSON
   - Qualquer string que contenha localhost
5. ✅ Garante que o Metro escute no IP correto

## 🔧 Como Funciona

### 1. Metro Config Intercepta Respostas

O `metro.config.js` foi atualizado para interceptar **TODAS** as respostas HTTP e substituir localhost:

```javascript
// Intercepta write() e end() das respostas
res.write = function(chunk) {
  // Substitui localhost no corpo da resposta
  const corrected = chunkStr.replace(/localhost/g, EXPO_IP);
  return originalWrite.call(this, Buffer.from(corrected));
};
```

### 2. Variáveis de Ambiente Forçadas

Todas as variáveis são configuradas antes de iniciar:

```bash
export REACT_NATIVE_PACKAGER_HOSTNAME="192.168.0.20"
export EXPO_PACKAGER_HOSTNAME="192.168.0.20"
export EXPO_NO_LOCALHOST="1"
export EXPO_USE_LOCALHOST="0"
```

### 3. Interceptação em Múltiplas Camadas

- **Middleware**: Intercepta requisições
- **Response Interception**: Intercepta respostas HTTP
- **Header Interception**: Intercepta headers HTTP
- **URL Rewriting**: Reescreve URLs antes de processar

## 📱 Como Usar

### Passo 1: Parar Expo Atual

```bash
pkill -f "expo start"
```

### Passo 2: Executar Script

```bash
./INICIAR_EXPO_SEM_LOCALHOST_DEFINITIVO.sh
```

### Passo 3: Escolher Modo

- **Opção 1 (LAN)**: Se iOS/Android estão na mesma rede Wi-Fi
- **Opção 2 (Tunnel)**: Se estão em redes diferentes

### Passo 4: Usar no Expo Go

**LAN Mode:**
- URL: `exp://192.168.0.20:8081`
- Cole manualmente no Expo Go

**Tunnel Mode:**
- Procure no terminal por URL que começa com `exp://`
- Cole manualmente no Expo Go

## 🧪 Verificar se Funcionou

Após iniciar, teste:

```bash
# Verificar se Metro está acessível no IP correto
curl http://192.168.0.20:8081/status

# Verificar se NÃO há localhost nas respostas
curl http://192.168.0.20:8081 | grep -i localhost
# (Não deve retornar nada)
```

## ⚠️ Importante

- ✅ **NUNCA** use URLs com localhost no Expo Go
- ✅ **SEMPRE** use o IP correto: `exp://192.168.0.20:8081`
- ✅ O script garante que mesmo se o Expo gerar localhost, será substituído
- ✅ O metro.config.js intercepta TODAS as respostas HTTP

## 🔍 Se Ainda Não Funcionar

1. **Verificar se está na mesma rede** (LAN mode):
   ```bash
   # No iOS/Android, verificar IP
   # Deve estar na mesma rede que 192.168.0.20
   ```

2. **Usar Tunnel Mode**:
   ```bash
   # Escolha opção 2 no script
   # Tunnel funciona mesmo em redes diferentes
   ```

3. **Verificar firewall**:
   ```bash
   sudo ufw allow 8081/tcp
   ```

4. **Verificar se Metro está rodando**:
   ```bash
   lsof -i :8081
   curl http://192.168.0.20:8081/status
   ```

## 📋 Resumo

1. Execute: `./INICIAR_EXPO_SEM_LOCALHOST_DEFINITIVO.sh`
2. Escolha LAN ou Tunnel
3. Use a URL `exp://192.168.0.20:8081` no Expo Go
4. O metro.config.js garante que NENHUMA resposta use localhost

**Resultado**: iOS e Android conseguem baixar o bundle corretamente! ✅

